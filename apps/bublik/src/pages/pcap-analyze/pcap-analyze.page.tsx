import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Buffer } from 'buffer';
import { DataSource, FrameMeta, ProtoTree } from '@goodtools/wiregasm';
import { z } from 'zod';

import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuItem,
	ContextMenuContent,
	ButtonTw,
	CardHeader,
	cn
} from '@/shared/tailwind-ui';

import { Data, PacketInfo, Position, PositionsMap, TypedWorker } from './types';
import { DissectionTree } from './dissection-tree';
import { DissectionDump } from './dissection-dump';

function usePcapAnalyzer() {
	const workerRef = useRef<TypedWorker | null>(null);
	const [, setFile] = useState<File | null>(null);
	const [filterInput, setFilterInput] = useState('');
	const [data, setData] = useState<Data[]>([]);
	const [selectedRowIdx, setSelectedRowIdx] = useState(0);
	const [selectedPacket, setSelectedPacket] = useState<PacketInfo | null>(null);
	const [preparedPositions, setPreparedPositions] = useState<PositionsMap>(
		new Map()
	);
	const [columns, setColumns] = useState<{ title: string; key: string }[]>([]);
	const [showTraceFlowDialog, setShowTraceFlowDialog] = useState(false);
	const [streamedData, setStreamedData] = useState<unknown[]>([]);
	const [, setFollowResult] = useState<unknown>(null);
	const [status, setStatus] = useState('Loading...');
	const [loading, setLoading] = useState(true);
	const [processed, setProcessed] = useState(false);
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
		(id: string, node: ProtoTree): Map<string, Position> => {
			console.log(node.tree);
			let map = new Map<string, Position>();
			const vector = node.tree as unknown as ProtoTree[];

			if (vector.length > 0) {
				for (let i = 0; i < vector.length; i++) {
					const subId = `${id}-${i}`;
					const subMap = preparePositions(subId, vector[i]);
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
					// eslint-disable-next-line no-case-declarations
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	const handleRowClick = (row: Data) => {
		setSelectedRowIdx(row.raw.number);
	};

	const handleTraceFlow = (row: Data) => {
		if (!row || !workerRef.current) return;
		const { port1, port2 } = new MessageChannel();

		port1.onmessage = (ev: MessageEvent<unknown>) => {
			const schema = z.object({
				followResult: z.unknown(),
				payloads: z.array(z.unknown()),
				filter: z.string()
			});

			const result = schema.safeParse(ev?.data);

			if (!result.success) {
				console.warn('Failed to parse trace flow');
				return;
			}

			setFollowResult(result.data.followResult);
			setStreamedData(result.data.payloads);
			setFilterInput(result.data.filter);
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

	const getRowStyle = (item: { raw: FrameMeta }) => {
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
		} catch (err: unknown) {
			console.error('Error loading sample PCAP:', err);
			if (err instanceof Error) setStatus(`Error: ${err.message}`);
			setLoading(false);
		}
	};

	return {
		filterInput,
		data,
		columns,
		selectedRowIdx,
		selectedPacket,
		showTraceFlowDialog,
		streamedData,
		status,
		loading,
		processed,
		selectedTreeEntry,
		initialized,
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
		<div className="font-mono">
			<table className="min-w-full divide-y divide-border-primary h-full">
				<thead
					className="sticky top-0"
					style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 10px' }}
				>
					<tr>
						{columns.map((column) => (
							<th
								key={column.key}
								className={cn(
									'px-2 h-[34px] bg-white border-r last:border-none border-border-primary text-left text-[0.6875rem] font-semibold leading-[0.875rem]',
									'relative'
								)}
							>
								{column.title}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-border-primary">
					{data.length > 0 ? (
						data.map((row, idx) => (
							<tr
								key={idx}
								onClick={() => onRowClick(row)}
								style={getRowStyle(row)}
								className="cursor-pointer hover:opacity-75"
							>
								{columns.map((column) => (
									<td
										key={column.key}
										className="px-2 h-[34px] last:border-none border-r text-[0.75rem] leading-[1.125rem] font-medium"
									>
										{row[column.key] as ReactNode}
									</td>
								))}
							</tr>
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

export function PcapAnalyzePage() {
	const {
		filterInput,
		data,
		columns,
		selectedPacket,
		loading,
		processed,
		selectedTreeEntry,
		setFilterInput,
		handleRowClick,
		handleTraceFlow,
		handleDataSourceSelect,
		getRowStyle,
		handleLoadSamplePcap,
		setSelectedTreeEntry
	} = usePcapAnalyzer();

	return (
		<div className="flex flex-col gap-1 p-2 h-full overflow-hidden">
			<div className="h-full overflow-hidden">
				<CardHeader
					label={
						<div className="flex items-center gap-4">
							<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] shrink-0">
								Packet Capture
							</span>
							<input
								placeholder="tcp"
								value={filterInput}
								onChange={(e) => setFilterInput(e.target.value)}
								className={cn(
									'w-full px-3.5 py-[0px] outline-none rounded text-text-secondary transition-all active:shadow-none',
									'border border-border-primary hover:border-primary',
									'disabled:text-text-menu disabled:cursor-not-allowed',
									'focus:border-primary focus:shadow-text-field focus:ring-transparent'
								)}
							/>
						</div>
					}
					className="bg-white rounded-t-md"
				>
					<div className="flex items-center gap-4">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={handleLoadSamplePcap}
						>
							Load Sample
						</ButtonTw>
					</div>
				</CardHeader>

				<div className="overflow-auto h-full bg-white">
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
			</div>

			{selectedPacket && selectedPacket.tree?.length > 0 && (
				<div className="flex flex-col md:flex-row gap-1 h-[20vh]">
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
							(data_source: DataSource, idx: number) => {
								return (
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
											onSelect={(pos: number) =>
												handleDataSourceSelect(idx, pos)
											}
										/>
									</div>
								);
							}
						)}
					</div>
				</div>
			)}
		</div>
	);
}
