import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Buffer } from 'buffer';
import { DataSource } from '@goodtools/wiregasm';

import { DrawerRoot, DrawerContent } from '@/shared/tailwind-ui';
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuItem,
	ContextMenuContent
} from '@/shared/tailwind-ui';

import { TypedWorker } from './types';
import { DissectionTree, TreeNode } from './dissection-tree';
import { DissectionDump } from './dissection-dump';

type Position = { idx: number; start: number; length: number };
type PositionsMap = Map<string, Position>;
type PacketInfo = {
	data_sources: DataSource[];
	tree: TreeNode[];
	type: string;
};
type Data = Record<string, unknown> & { raw: any };

function usePcapAnalyzer() {
	const workerRef = useRef<TypedWorker | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [filterInput, setFilterInput] = useState('');
	const [data, setData] = useState<Data[]>([]);
	const [selectedRowIdx, setSelectedRowIdx] = useState(0);
	const [selectedPacket, setSelectedPacket] = useState<PacketInfo | null>(null);
	const [preparedPositions, setPreparedPositions] = useState<PositionsMap>(
		new Map()
	);
	const [columns, setColumns] = useState<{ title: string; key: string }[]>([]);
	const [showTraceFlowDialog, setShowTraceFlowDialog] = useState(false);
	const [streamedData, setStreamedData] = useState<any[]>([]);
	const [followResult, setFollowResult] = useState<any>(null);
	const [status, setStatus] = useState('Loading...');
	const [loading, setLoading] = useState(true);
	const [processed, setProcessed] = useState(false);
	const [summary, setSummary] = useState<any>(null);
	const [initialized, setInitialized] = useState(false);
	const [selectedTreeEntry, setSelectedTreeEntry] = useState<{
		id: string;
		idx: number;
		start: number;
		length: number;
	}>({
		id: '',
		idx: 0,
		start: 0,
		length: 0
	});

	const preparePositions = useCallback(
		(id: string, node: any): Map<string, Position> => {
			let map = new Map<string, Position>();
			if (node.tree?.length > 0) {
				for (let i = 0; i < node.tree.length; i++) {
					const subId = `${id}-${i}`;
					const subMap = preparePositions(subId, node.tree[i]);
					map = new Map([...map, ...subMap]);
				}
			} else if (node.length > 0) {
				map.set(id, {
					id,
					idx: node.data_source_idx,
					start: node.start,
					length: node.length
				});
			}
			return map;
		},
		[]
	);

	const fetchTableData = useCallback(() => {
		if (!workerRef.current || columns.length === 0 || !processed) {
			console.log('Cannot fetch data - conditions not met:', {
				hasWorker: !!workerRef.current,
				columnsLength: columns.length,
				processed
			});
			return;
		}

		console.log('Fetching table data with filter:', filterInput);
		setLoading(true);
		const { port1, port2 } = new MessageChannel();

		port1.onmessage = (ev: MessageEvent<any>) => {
			try {
				console.log('Received table data response:', ev.data);
				const { data } = ev.data;
				if (!data?.frames) {
					console.error('No frames in response data:', data);
					throw new Error('Invalid data format - no frames');
				}

				const dataSource = data.frames.map((f: Record<string, unknown>) =>
					columns.reduce(
						(acc, col, idx) => {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							acc[col.key] = (f as any).columns[idx];
							return acc;
						},
						{ raw: f } as Record<string, unknown>
					)
				);

				setData(dataSource as unknown as Data[]);
			} catch (error) {
				console.error('Error processing table data:', error);
				setStatus(
					'Failed to process table data: ' +
						(error instanceof Error ? error.message : 'Unknown error')
				);
			} finally {
				port1.close();
				setLoading(false);
			}
		};

		try {
			workerRef.current.postMessage(
				{
					type: 'select-frames',
					skip: 0,
					limit: 0,
					filter: filterInput
				},
				[port2]
			);
		} catch (error) {
			console.error('Error sending select-frames message:', error);
			setLoading(false);
		}
	}, [columns, filterInput, processed]);

	useEffect(() => {
		console.log('Initializing worker...');
		const worker = new Worker(
			new URL('./wireshark.worker.ts', import.meta.url),
			{ type: 'module' }
		) as TypedWorker;

		workerRef.current = worker;

		const messageHandler = (ev: MessageEvent<any>) => {
			console.log('Worker message received:', ev.data.type, ev.data);
			const { type } = ev.data;
			let positions: Map<string, Position> = new Map();

			switch (type) {
				case 'init':
					console.log('Worker initialized');
					setLoading(false);
					setInitialized(true);
					worker.postMessage({ type: 'columns' });
					break;

				case 'columned':
					console.log('Columns received:', ev.data.columns);
					const newColumns = ev.data.columns.map((c: string) => ({
						title: c,
						key: c
					}));
					setColumns(newColumns);
					break;

				case 'status':
					setStatus(ev.data.status);
					break;

				case 'processed':
					console.log('File processed:', ev.data);
					setSummary(ev.data.summary);
					setProcessed(true);
					if (selectedRowIdx === 0) setSelectedRowIdx(1);
					break;

				case 'selected':
					console.log('Packet selected:', ev.data);
					positions = preparePositions('root', ev.data);
					setPreparedPositions(positions);
					setSelectedPacket(ev.data);
					break;

				case 'error':
					console.error('Worker error:', ev.data);
					setStatus(`Error: ${ev.data?.error}`);
					setLoading(false);
					break;

				default:
					console.log('Unhandled message type:', type);
					break;
			}
		};

		worker.addEventListener('message', messageHandler);

		return () => {
			console.log('Cleaning up worker');
			worker.terminate();
			worker.removeEventListener('message', messageHandler);
		};
	}, [preparePositions]);

	useEffect(() => {
		if (processed && columns.length > 0) {
			fetchTableData();
		}
	}, [processed, columns, fetchTableData]);

	useEffect(() => {
		if (processed && columns.length > 0) {
			fetchTableData();
		}
	}, [filterInput, processed, columns, fetchTableData]);

	useEffect(() => {
		if (processed && selectedRowIdx > 0 && workerRef.current) {
			workerRef.current.postMessage({ type: 'select', number: selectedRowIdx });
		}
	}, [selectedRowIdx, processed]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const selectedFile = files[0];
		setFile(selectedFile);
		setProcessed(false);
		setData([]);
		setStatus('Processing file...');

		selectedFile
			.arrayBuffer()
			.then((buf) => {
				if (!workerRef.current) {
					console.error('Worker not available');
					return;
				}
				workerRef.current.postMessage(
					{
						type: 'process',
						name: selectedFile.name,
						arrayBuffer: buf
					},
					[buf]
				);
			})
			.catch((error) => {
				console.error('Error reading file:', error);
				setStatus(`Error reading file: ${error.message}`);
			});
	};

	const handleRowClick = (row: any) => {
		setSelectedRowIdx(row.raw.number);
	};

	const handleTraceFlow = (row: any) => {
		if (!row || !workerRef.current) return;
		const { port1, port2 } = new MessageChannel();

		port1.onmessage = (ev: MessageEvent<any>) => {
			setFollowResult(ev.data.followResult);
			setStreamedData(ev.data.payloads);
			setFilterInput(ev.data.filter);
		};

		workerRef.current.postMessage(
			{ type: 'follow-stream', number: row.raw.number },
			[port2]
		);
		setShowTraceFlowDialog(true);
	};

	const handleDataSourceSelect = (src_idx: number, pos: number) => {
		let current: string | null = null;
		let smallestEntry: Position | null = null;
		preparedPositions.forEach((pp, id) => {
			if (pp.idx !== src_idx) return;
			if (pos >= pp.start && pos <= pp.start + pp.length) {
				if (!smallestEntry || smallestEntry.length > pp.length) {
					smallestEntry = pp;
					current = id;
				}
			}
		});
		if (current && smallestEntry) {
			setSelectedTreeEntry(smallestEntry);
		}
	};

	const getRowStyle = (item: any) => {
		const raw = item.raw;
		return {
			backgroundColor: `#${Number(raw.bg || 0xffffff)
				.toString(16)
				.padStart(6, '0')}`,
			color: `#${Number(raw.fg || 0x000000)
				.toString(16)
				.padStart(6, '0')}`
		};
	};

	const handleLoadSamplePcap = async () => {
		const SAMPLE_URLS = [
			'/v2/samples/dhcp.pcap',
			'/v2/samples/diameter_non_standard.pcap',
			'/v2/samples/dns_port.pcap',
			'/v2/samples/http.cap',
			'/v2/samples/tftp_rrq.pcap',
			'/v2/samples/http2-16-ssl.pcapng'
		];

		try {
			const sampleUrl =
				SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)];
			setStatus(`Fetching sample file from: ${sampleUrl}`);
			setProcessed(false);
			setData([]);
			setLoading(true);

			const res = await fetch(sampleUrl);
			if (!res.ok) throw new Error(`Failed to fetch sample: ${sampleUrl}`);
			const buf = await res.arrayBuffer();

			if (!workerRef.current) {
				setStatus('Worker not available');
				setLoading(false);
				return;
			}

			const filename = sampleUrl.split('/').pop() || 'sample.pcap';
			workerRef.current.postMessage(
				{
					type: 'process',
					name: filename,
					arrayBuffer: buf
				},
				[buf]
			);
			setStatus(`Processing sample file: ${filename}`);
		} catch (err: any) {
			console.error('Error loading sample PCAP:', err);
			setStatus(`Error: ${err.message}`);
			setLoading(false);
		}
	};

	return {
		// State
		filterInput,
		data,
		columns,
		selectedRowIdx,
		selectedPacket,
		showTraceFlowDialog,
		streamedData,
		followResult,
		status,
		loading,
		processed,
		summary,
		selectedTreeEntry,
		initialized,

		// Actions
		setFilterInput,
		handleFileChange,
		handleRowClick,
		handleTraceFlow,
		handleDataSourceSelect,
		getRowStyle,
		handleLoadSamplePcap,
		setShowTraceFlowDialog,
		setSelectedTreeEntry
	};
}

interface PacketTableProps {
	data: Data[];
	columns: { title: string; key: string }[];
	loading: boolean;
	processed: boolean;
	onRowClick: (row: Data) => void;
	onTraceFlow: (row: Data) => void;
	getRowStyle: (item: Data) => React.CSSProperties;
}

function PacketTable(props: PacketTableProps) {
	const {
		data,
		columns,
		loading,
		processed,
		onRowClick,
		onTraceFlow,
		getRowStyle
	} = props;

	return (
		<div className="overflow-auto max-h-96">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50 sticky top-0">
					<tr>
						{columns.map((column) => (
							<th
								key={column.key}
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{column.title}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{data.length > 0 ? (
						data.map((row, index) => (
							<ContextMenu key={index}>
								<ContextMenuTrigger asChild>
									<tr
										onClick={() => onRowClick(row)}
										style={getRowStyle(row)}
										className="cursor-pointer hover:opacity-75"
									>
										{columns.map((column) => (
											<td
												key={column.key}
												className="px-6 py-4 whitespace-nowrap text-sm"
											>
												{row[column.key] as ReactNode}
											</td>
										))}
									</tr>
								</ContextMenuTrigger>
								<ContextMenuContent>
									<ContextMenuItem
										label="Trace Flow"
										onClick={() => onTraceFlow(row)}
									/>
								</ContextMenuContent>
							</ContextMenu>
						))
					) : (
						<tr>
							<td
								colSpan={columns.length || 1}
								className="px-6 py-4 text-center text-gray-500"
							>
								{loading
									? 'Loading...'
									: processed
									? 'No data available'
									: 'Please select a PCAP file'}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

interface TraceFlowDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	streamedData: any[];
	followResult: any;
}

function TraceFlowDialog(props: TraceFlowDialogProps) {
	const { open, onOpenChange, streamedData, followResult } = props;

	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="w-full max-w-4xl flex flex-col">
				<div className="border-b p-4 flex justify-between items-center">
					<h3 className="text-lg font-semibold">Trace Flow</h3>
					<button
						onClick={() => onOpenChange(false)}
						className="text-gray-500 hover:text-gray-700"
					>
						&times;
					</button>
				</div>
				<div className="p-4 flex-grow overflow-auto">
					{streamedData.length > 0 ? (
						<div className="space-y-3">
							{streamedData.map((data, index) => (
								<div
									key={index}
									className={`whitespace-pre-wrap p-2 rounded ${
										data.server
											? 'bg-red-50 text-red-700'
											: 'bg-blue-50 text-blue-700'
									}`}
								>
									<div>{data.data}</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-2 text-sm">
							<div>
								Server: {followResult?.shost}:{followResult?.sport}
							</div>
							<div>
								Client: {followResult?.chost}:{followResult?.cport}
							</div>
							<div>Sent by Server: {followResult?.sbytes} bytes</div>
							<div>Sent by Client: {followResult?.cbytes} bytes</div>
						</div>
					)}
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export function PcapAnalyzePage() {
	const {
		filterInput,
		data,
		columns,
		selectedPacket,
		showTraceFlowDialog,
		streamedData,
		followResult,
		loading,
		processed,
		selectedTreeEntry,
		setFilterInput,
		handleFileChange,
		handleRowClick,
		handleTraceFlow,
		handleDataSourceSelect,
		getRowStyle,
		handleLoadSamplePcap,
		setShowTraceFlowDialog,
		setSelectedTreeEntry
	} = usePcapAnalyzer();

	return (
		<div className="p-5">
			<div className="mb-4 flex items-center justify-start gap-4">
				<label className="text-sm font-medium shrink-0 mb-1">PCAP File</label>
				<input
					type="file"
					onChange={handleFileChange}
					accept=".pcap,.pcapng,.cap"
					className="text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
				/>
				<button
					onClick={handleLoadSamplePcap}
					className="text-sm mr-4 py-2 px-4 rounded-md border-0 font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
				>
					Load <strong>Random</strong> Sample
				</button>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Display Filter</label>
				<input
					type="text"
					placeholder="e.g., tcp"
					value={filterInput}
					onChange={(e) => setFilterInput(e.target.value)}
					className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="border rounded-md shadow-sm overflow-hidden mb-6">
				<PacketTable
					data={data}
					columns={columns}
					loading={loading}
					processed={processed}
					onRowClick={handleRowClick}
					onTraceFlow={handleTraceFlow}
					getRowStyle={getRowStyle}
				/>
			</div>

			{selectedPacket && selectedPacket.tree?.length > 0 && (
				<div className="flex flex-col md:flex-row gap-4 mt-4 h-[400px]">
					<div className="w-full md:w-1/2 overflow-auto border rounded-md p-4 bg-white">
						<DissectionTree
							id="root"
							tree={selectedPacket.tree}
							selected={selectedTreeEntry.id}
							select={setSelectedTreeEntry}
							setFilter={setFilterInput}
						/>
					</div>
					<div className="w-full md:w-1/2 overflow-auto border rounded-md p-4 bg-white">
						{selectedPacket.data_sources.map(
							(data_source: any, idx: number) => (
								<div key={idx} className="mb-4 last:mb-0">
									<DissectionDump
										buffer={
											new Uint8Array(Buffer.from(data_source.data, 'base64'))
										}
										selected={
											idx === selectedTreeEntry.idx
												? [selectedTreeEntry.start, selectedTreeEntry.length]
												: [0, 0]
										}
										onSelect={(pos: number) => handleDataSourceSelect(idx, pos)}
									/>
								</div>
							)
						)}
					</div>
				</div>
			)}

			<TraceFlowDialog
				open={showTraceFlowDialog}
				onOpenChange={setShowTraceFlowDialog}
				streamedData={streamedData}
				followResult={followResult}
			/>
		</div>
	);
}
