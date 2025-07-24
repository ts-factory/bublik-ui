import { useState, useEffect, useRef, useCallback } from 'react';
import { get, map, reduce } from 'lodash';
import { Buffer } from 'buffer';

import { TypedWorker } from './types';
import { DissectionTree } from './dissection-tree';
import { DissectionDump } from './dissection-dump';

function PcapAnalyzePage() {
	const [file, setFile] = useState<File | null>(null);
	const [filterInput, setFilterInput] = useState('');
	const [tableData, setTableData] = useState<Record<string, any>[]>([]);
	const [selectedRowIdx, setSelectedRowIdx] = useState(0);
	const [selectedPacket, setSelectedPacket] = useState<any>(null);
	const [preparedPositions, setPreparedPositions] = useState<Map<string, any>>(
		new Map()
	);
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
	const [columns, setColumns] = useState<{ title: string; key: string }[]>([]);
	const [showTraceFlowDialog, setShowTraceFlowDialog] = useState(false);
	const [contextMenu, setContextMenu] = useState<{
		show: boolean;
		x: number;
		y: number;
		row: any;
	}>({
		show: false,
		x: 0,
		y: 0,
		row: null
	});
	const [streamedData, setStreamedData] = useState<any[]>([]);
	const [followResult, setFollowResult] = useState<any>(null);
	const [status, setStatus] = useState('Loading...');
	const [loading, setLoading] = useState(true);
	const [processed, setProcessed] = useState(false);
	const [summary, setSummary] = useState<any>(null);
	const [initialized, setInitialized] = useState(false);

	const workerRef = useRef<TypedWorker | null>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);

	const preparePositions = useCallback(
		(id: string, node: any): Map<string, any> => {
			let map = new Map();
			if (node.tree?.length > 0) {
				for (let i = 0; i < node.tree.length; i++) {
					map = new Map([
						...map,
						...preparePositions(`${id}-${i}`, node.tree[i])
					]);
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

	const fetchTableData = useCallback(async () => {
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

				console.log('Processing', data.frames.length, 'frames');
				const dataSource = map(data.frames, (f: any) => {
					return reduce(
						columns,
						(acc, col, idx) => {
							// @ts-expect-error fix me
							acc[col.key] = get(f, ['columns', idx]);
							return acc;
						},
						{ raw: f }
					);
				});

				console.log('Processed table data:', dataSource.length, 'rows');
				setTableData(dataSource);
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

			let newColumns: { title: string; key: string }[] = [];
			let positions: Map<string, any> = new Map();
			switch (type) {
				case 'init':
					console.log('Worker initialized');
					setLoading(false);
					setInitialized(true);
					// Request columns immediately after initialization
					worker.postMessage({ type: 'columns' });
					break;

				case 'columned':
					console.log('Columns received:', ev.data.columns);
					newColumns = ev.data.columns.map(
						(c: string): { title: string; key: string } => ({
							title: c,
							key: c
						})
					);
					console.log('Setting columns:', newColumns);
					setColumns(newColumns);
					break;

				case 'status':
					console.log('Status update:', ev.data.status);
					setStatus(ev.data.status);
					break;

				case 'processed':
					console.log('File processed:', ev.data);
					setSummary(ev.data.summary);
					setProcessed(true);
					// Note: Don't call fetchTableData here - wait for useEffect
					if (selectedRowIdx === 0) setSelectedRowIdx(1);
					break;

				case 'selected':
					console.log('Packet selected:', ev.data);
					positions = preparePositions('root', ev.data);
					setPreparedPositions(new Map(positions));
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
	}, []);

	useEffect(() => {
		console.log('Checking fetch conditions:', {
			processed,
			columnsLength: columns.length
		});
		if (processed && columns.length > 0) {
			console.log('All conditions met, fetching table data');
			fetchTableData();
		}
	}, [processed, columns, fetchTableData]);

	useEffect(() => {
		if (processed && columns.length > 0) {
			console.log('Filter changed, refetching data');
			fetchTableData();
		}
	}, [filterInput, processed, columns, fetchTableData]);

	useEffect(() => {
		if (processed && selectedRowIdx > 0 && workerRef.current) {
			console.log('Selecting packet:', selectedRowIdx);
			workerRef.current.postMessage({ type: 'select', number: selectedRowIdx });
		}
	}, [selectedRowIdx, processed]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const selectedFile = files[0];
		console.log('File selected:', selectedFile.name, selectedFile.size);
		setFile(selectedFile);
		setProcessed(false);
		setTableData([]);
		setStatus('Processing file...');

		selectedFile
			.arrayBuffer()
			.then((buf) => {
				console.log('Sending file to worker:', buf.byteLength, 'bytes');
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
		console.log('Row clicked:', row.raw.number);
		setSelectedRowIdx(row.raw.number);
	};

	const handleTraceFlow = () => {
		if (!contextMenu.row || !workerRef.current) return;

		const { port1, port2 } = new MessageChannel();
		port1.onmessage = (ev: MessageEvent<any>) => {
			setFollowResult(ev.data.followResult);
			setStreamedData(ev.data.payloads);
			setFilterInput(ev.data.filter);
		};

		workerRef.current.postMessage(
			{ type: 'follow-stream', number: contextMenu.row.raw.number },
			[port2]
		);

		setShowTraceFlowDialog(true);
		setContextMenu({ show: false, x: 0, y: 0, row: null });
	};

	const handleDataSourceSelect = (src_idx: number, pos: number) => {
		let current: string | null = null;
		let smallestEntry: any = null;

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

	return (
		<div className="p-5">
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">PCAP File</label>
				<input
					type="file"
					onChange={handleFileChange}
					accept=".pcap,.pcapng,.cap"
					className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
				/>
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

			{/* Debug info */}
			<div className="mb-4 p-3 bg-gray-100 text-sm rounded">
				<div>
					<strong>Status:</strong> {status}
				</div>
				<div>
					<strong>Initialized:</strong> {initialized.toString()}
				</div>
				<div>
					<strong>Processed:</strong> {processed.toString()}
				</div>
				<div>
					<strong>Columns:</strong> {columns.length}
				</div>
				<div>
					<strong>Table Data:</strong> {tableData.length} rows
				</div>
				<div>
					<strong>Loading:</strong> {loading.toString()}
				</div>
				<div>
					<strong>Selected Row:</strong> {selectedRowIdx}
				</div>
			</div>

			<div className="border rounded-md shadow-sm overflow-hidden mb-6">
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
							{tableData.length > 0 ? (
								tableData.map((row, index) => (
									<tr
										key={index}
										onClick={() => handleRowClick(row)}
										style={getRowStyle(row)}
										className="cursor-pointer hover:opacity-75"
									>
										{columns.map((column) => (
											<td
												key={column.key}
												className="px-6 py-4 whitespace-nowrap text-sm"
											>
												{row[column.key]}
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
			</div>

			{selectedPacket?.tree?.length > 0 && (
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

			{/* Context Menu */}
			{contextMenu.show && (
				<div
					ref={contextMenuRef}
					className="fixed z-50 bg-white shadow-lg rounded-md py-1 min-w-[120px] border border-gray-200"
					style={{ left: contextMenu.x, top: contextMenu.y }}
				>
					<button
						onClick={handleTraceFlow}
						className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
					></button>
				</div>
			)}

			{/* Trace Flow Dialog */}
			{showTraceFlowDialog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
						<div className="border-b p-4 flex justify-between items-center">
							<h3 className="text-lg font-semibold">Trace Flow</h3>
							<button
								onClick={() => setShowTraceFlowDialog(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								&times;
							</button>
						</div>
						<div className="overflow-auto p-4 flex-grow">
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
									<div>{`Server: ${followResult?.shost}:${followResult?.sport}`}</div>
									<div>{`Client: ${followResult?.chost}:${followResult?.cport}`}</div>
									<div>{`Sent by Server: ${followResult?.sbytes} bytes`}</div>
									<div>{`Sent by Client: ${followResult?.cbytes} bytes`}</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{loading && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-lg">
						<p className="text-center">{status}</p>
					</div>
				</div>
			)}
		</div>
	);
}

export { PcapAnalyzePage };
