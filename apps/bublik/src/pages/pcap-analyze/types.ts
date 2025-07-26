import type { LoadResponse } from '@goodtools/wiregasm';

export interface WorkerMessageMap {
	columns: object;
	select: { number: number };
	'select-frames': { skip: number; limit: number; filter: string };
	'check-filter': { filter: string };
	'follow-stream': { number: number };
	process: { name: string; arrayBuffer: ArrayBuffer };
}

export interface WorkerResponseMap {
	init: object;
	error: { error: any };
	status: { status: string; code?: number };
	columned: { columns: string[] };
	selected: { tree: any[]; data_sources: Array<{ idx: number; data: string }> };
	processed: { summary: LoadResponse; name: string };
}

export interface TypedWorker extends Omit<Worker, 'postMessage'> {
	postMessage<K extends keyof WorkerMessageMap>(
		message: { type: K } & (WorkerMessageMap[K] extends never
			? Record<string, never>
			: WorkerMessageMap[K]),
		transfer?: Transferable[]
	): void;
}

export type WorkerResponse<K extends keyof WorkerResponseMap> = {
	type: K;
	data: WorkerResponseMap[K];
};
