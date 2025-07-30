import type {
	DataSource,
	FrameMeta,
	LoadResponse,
	ProtoTree
} from '@goodtools/wiregasm';

import { TreeNode } from './dissection-tree';

export interface WorkerMessageMap {
	columns: Record<string, unknown>;
	select: { number: number };
	'select-frames': { skip: number; limit: number; filter: string };
	'check-filter': { filter: string };
	'follow-stream': { number: number };
	process: { name: string; arrayBuffer: ArrayBuffer };
}

export interface WorkerResponseMap {
	init: object;
	error: { error: unknown };
	status: { status: string; code?: number };
	columned: { columns: string[] };
	selected: {
		tree: ProtoTree[];
		data_sources: Array<{ idx: number; data: string }>;
	};
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

export type Position = {
	id: string;
	idx?: number;
	start?: number;
	length: number;
};

export type PositionsMap = Map<string, Position>;

export type PacketInfo = {
	type: string;
	data_sources: DataSource[];
	tree: TreeNode[];
};

export type Data = Record<string, unknown> & { raw: FrameMeta };
