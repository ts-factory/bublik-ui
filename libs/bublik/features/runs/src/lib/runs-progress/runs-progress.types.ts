/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { NodeEntity, RunData, RunsData } from '@/shared/types';

type RunsProgressTrend =
	| 'added'
	| 'removed'
	| 'improved'
	| 'regressed'
	| 'changed'
	| 'same';

type RunsProgressTrendDirection =
	| 'higher-is-better'
	| 'lower-is-better'
	| 'neutral';

type RunsProgressCell = {
	runId: number;
	node: RunData | null;
	previousNode: RunData | null;
	trend: RunsProgressTrend;
};

type RunsProgressRow = {
	id: string;
	name: string;
	type: NodeEntity;
	path: string[];
	depth: number;
	objective?: string;
	cells: RunsProgressCell[];
	children: RunsProgressRow[];
};

type RunsProgressRun = {
	run: RunsData;
	root: RunData;
	groupId?: string;
};

type RunsProgressGroup = {
	id: string;
	label: string;
	startIndex: number;
	runCount: number;
};

type RunsProgressPackage = {
	name: string;
	runCount: number;
};

type RunsProgressFilterSummary = {
	label: string;
	value: string;
};

export type {
	RunsProgressCell,
	RunsProgressFilterSummary,
	RunsProgressGroup,
	RunsProgressPackage,
	RunsProgressRow,
	RunsProgressRun,
	RunsProgressTrend,
	RunsProgressTrendDirection
};
