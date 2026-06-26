/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

import { RunData, RunsData, RunStats } from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';

import {
	RunsProgressFilterSummary,
	RunsProgressGroup,
	RunsProgressPackage,
	RunsProgressRow,
	RunsProgressRun,
	RunsProgressTrend,
	RunsProgressTrendDirection
} from './runs-progress.types';

const OTHER_GROUP_ID = '__other__';

const EMPTY_STATS: RunStats = {
	abnormal: 0,
	failed: 0,
	failed_unexpected: 0,
	passed: 0,
	passed_unexpected: 0,
	skipped: 0,
	skipped_unexpected: 0
};

type AnnotatedNode = {
	key: string;
	parentKey: string | null;
	node: RunData;
	depth: number;
};

function annotateRunNodes(root: RunData): AnnotatedNode[] {
	const nodes: AnnotatedNode[] = [];

	function visit(
		node: RunData,
		parentKey: string | null,
		depth: number,
		key: string
	) {
		nodes.push({ key, parentKey, node, depth });

		const childrenByTestId = new Map<number, RunData[]>();

		node.children.forEach((child) => {
			childrenByTestId.set(child.test_id, [
				...(childrenByTestId.get(child.test_id) ?? []),
				child
			]);
		});

		childrenByTestId.forEach((children) => {
			children.sort((left, right) => left.exec_seqno - right.exec_seqno);
		});

		[...node.children]
			.sort((left, right) => left.exec_seqno - right.exec_seqno)
			.forEach((child) => {
				const siblings = childrenByTestId.get(child.test_id) ?? [];
				const occurrence =
					siblings.findIndex(
						(sibling) => sibling.exec_seqno === child.exec_seqno
					) + 1;
				const childKey = `${key}/${child.type}:${child.test_id}:${occurrence}`;

				visit(child, key, depth + 1, childKey);
			});
	}

	visit(root, null, 0, `${root.type}:${root.test_id}:1`);

	return nodes;
}

function getStatsBadness(node: RunData | null): number | null {
	if (!node) return null;

	const stats = node.stats;

	return (
		stats.abnormal * 4 +
		stats.failed_unexpected * 4 +
		stats.failed * 2 +
		stats.passed_unexpected * 2 +
		stats.skipped_unexpected +
		stats.skipped
	);
}

function getStatsTotal(stats: RunStats): number {
	return (
		stats.abnormal +
		stats.failed +
		stats.failed_unexpected +
		stats.passed +
		stats.passed_unexpected +
		stats.skipped +
		stats.skipped_unexpected
	);
}

function getUnexpectedTotal(stats: RunStats): number {
	return (
		stats.passed_unexpected + stats.failed_unexpected + stats.skipped_unexpected
	);
}

function getExpectedTotal(stats: RunStats): number {
	return stats.passed + stats.failed + stats.skipped;
}

function getNodeStats(node: RunData | null): RunStats {
	return node?.stats ?? EMPTY_STATS;
}

function getNodeTrend(
	node: RunData | null,
	previousNode: RunData | null
): RunsProgressTrend {
	if (node && !previousNode) return 'added';
	if (!node && previousNode) return 'removed';
	if (!node && !previousNode) return 'same';

	const badness = getStatsBadness(node);
	const previousBadness = getStatsBadness(previousNode);

	if (badness === previousBadness) return 'same';
	if (badness === null || previousBadness === null) return 'changed';
	if (badness < previousBadness) return 'improved';
	if (badness > previousBadness) return 'regressed';

	return 'changed';
}

function buildRunsProgressRows(runs: RunsProgressRun[]): RunsProgressRow[] {
	const rowByKey = new Map<string, RunsProgressRow>();
	const nodeMaps = runs.map(({ root }) => {
		const nodeMap = new Map<string, RunData>();

		annotateRunNodes(root).forEach(({ key, parentKey, node, depth }) => {
			nodeMap.set(key, node);

			if (!rowByKey.has(key)) {
				rowByKey.set(key, {
					id: key,
					name: node.test_name,
					type: node.type,
					path: node.path,
					depth,
					objective: node.objective,
					cells: [],
					children: []
				});
			}

			const row = rowByKey.get(key);
			const parent = parentKey ? rowByKey.get(parentKey) : null;

			if (
				row &&
				parent &&
				!parent.children.some((child) => child.id === row.id)
			) {
				parent.children.push(row);
			}
		});

		return nodeMap;
	});

	rowByKey.forEach((row) => {
		row.cells = runs.map(({ run, groupId }, runIndex) => {
			const node = nodeMaps[runIndex].get(row.id) ?? null;
			const previousRun = runs[runIndex + 1];
			const sameGroup = previousRun ? previousRun.groupId === groupId : false;
			const previousNode = sameGroup
				? nodeMaps[runIndex + 1]?.get(row.id) ?? null
				: null;

			return {
				runId: run.id,
				node,
				previousNode,
				trend: getNodeTrend(node, previousNode)
			};
		});
	});

	return Array.from(rowByKey.values()).filter((row) => row.depth === 0);
}

function rowHasChange(row: RunsProgressRow): boolean {
	return row.cells.some((cell) => cell.trend !== 'same');
}

function filterChangedRows(rows: RunsProgressRow[]): RunsProgressRow[] {
	function visit(row: RunsProgressRow): RunsProgressRow | null {
		const children = row.children
			.map(visit)
			.filter((child): child is RunsProgressRow => child !== null);

		if (!children.length && !rowHasChange(row)) return null;

		return { ...row, children };
	}

	return rows.map(visit).filter((row): row is RunsProgressRow => row !== null);
}

function getMetadataKey(item: string): string {
	const index = item.indexOf('=');

	return index === -1 ? item : item.slice(0, index);
}

function getMetadataKeys(runs: RunsData[]): string[] {
	const keys = new Set<string>();

	runs.forEach((run) => {
		run.metadata.filter(Boolean).forEach((item) => {
			keys.add(getMetadataKey(item));
		});
	});

	return Array.from(keys).sort((left, right) => left.localeCompare(right));
}

function getRunPackageName(root: RunData): string {
	return root.test_name;
}

function buildPackageSummaries(runs: RunsProgressRun[]): RunsProgressPackage[] {
	const countByName = new Map<string, number>();

	runs.forEach(({ root }) => {
		const name = getRunPackageName(root);

		countByName.set(name, (countByName.get(name) ?? 0) + 1);
	});

	return Array.from(countByName, ([name, runCount]) => ({ name, runCount }));
}

function getRunGroupValue(run: RunsData, key: string): string | null {
	const prefix = `${key}=`;
	const item = run.metadata.find((entry) => entry.startsWith(prefix));

	return item ? item.slice(prefix.length) : null;
}

const GROUP_TIME_ANCHOR = new Date(2024, 0, 1);

type TimeBucket = { id: string; label: string };

function getTimeBucket(run: RunsData, days: number): TimeBucket {
	const runDay = parseISO(formatTimeToAPI(parseISO(run.start)));
	const index = Math.floor(
		differenceInCalendarDays(runDay, GROUP_TIME_ANCHOR) / days
	);
	const start = addDays(GROUP_TIME_ANCHOR, index * days);
	const end = addDays(start, days - 1);
	const label =
		days === 1
			? format(start, 'MMM d')
			: `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;

	return { id: String(index), label };
}

type GroupByOptions = {
	timeFrameDays: number | null;
	metaKey: string | null;
};

type GroupRunsResult = {
	orderedRuns: RunsProgressRun[];
	groups: RunsProgressGroup[];
	timeGroups: RunsProgressGroup[];
};

function groupRuns(
	runs: RunsProgressRun[],
	{ timeFrameDays, metaKey }: GroupByOptions
): GroupRunsResult {
	if (!timeFrameDays && !metaKey) {
		return { orderedRuns: runs, groups: [], timeGroups: [] };
	}

	type Leaf = {
		groupId: string;
		timeId: string;
		timeLabel: string;
		metaLabel: string;
		members: RunsProgressRun[];
	};

	const leaves = new Map<string, Leaf>();
	const leafOrder: string[] = [];

	runs.forEach((progressRun) => {
		const time = timeFrameDays
			? getTimeBucket(progressRun.run, timeFrameDays)
			: { id: '', label: '' };
		const metaValue = metaKey
			? getRunGroupValue(progressRun.run, metaKey) ?? OTHER_GROUP_ID
			: '';
		const groupId = `${time.id}|${metaValue}`;

		if (!leaves.has(groupId)) {
			leaves.set(groupId, {
				groupId,
				timeId: time.id,
				timeLabel: time.label,
				metaLabel: metaValue === OTHER_GROUP_ID ? `No ${metaKey}` : metaValue,
				members: []
			});
			leafOrder.push(groupId);
		}

		leaves.get(groupId)?.members.push({ ...progressRun, groupId });
	});

	const orderedLeaves = timeFrameDays
		? [...leafOrder].sort((left, right) => {
				const leftTime = Number(leaves.get(left)?.timeId);
				const rightTime = Number(leaves.get(right)?.timeId);

				return rightTime - leftTime;
		  })
		: leafOrder;

	const orderedRuns: RunsProgressRun[] = [];
	const groups: RunsProgressGroup[] = [];
	const timeGroups: RunsProgressGroup[] = [];
	const showTimeBand = Boolean(timeFrameDays) && Boolean(metaKey);

	orderedLeaves.forEach((groupId) => {
		const leaf = leaves.get(groupId);

		if (!leaf) return;

		const startIndex = orderedRuns.length;

		groups.push({
			id: groupId,
			label: showTimeBand
				? leaf.metaLabel
				: timeFrameDays
				? leaf.timeLabel
				: leaf.metaLabel,
			startIndex,
			runCount: leaf.members.length
		});

		if (showTimeBand) {
			const lastTimeGroup = timeGroups[timeGroups.length - 1];

			if (lastTimeGroup && lastTimeGroup.id === leaf.timeId) {
				lastTimeGroup.runCount += leaf.members.length;
			} else {
				timeGroups.push({
					id: leaf.timeId,
					label: leaf.timeLabel,
					startIndex,
					runCount: leaf.members.length
				});
			}
		}

		orderedRuns.push(...leaf.members);
	});

	return { orderedRuns, groups, timeGroups };
}

function filterRunsByDateWindow(
	runs: RunsData[],
	startDate: string,
	finishDate: string
): RunsData[] {
	if (!startDate && !finishDate) return runs;

	return runs.filter((run) => {
		const runDay = formatTimeToAPI(parseISO(run.start));

		if (startDate && runDay < startDate) return false;
		if (finishDate && runDay > finishDate) return false;

		return true;
	});
}

function sortRunsNewestFirst(runs: RunsData[]): RunsData[] {
	return [...runs].sort((left, right) => {
		return new Date(right.start).getTime() - new Date(left.start).getTime();
	});
}

type MetricChangeKind = 'bad' | 'good' | 'neutral';

type MetricChange = { kind: MetricChangeKind; magnitude: number } | null;

function getMetricChange(
	direction: RunsProgressTrendDirection,
	value: number,
	previousValue: number,
	hasPrevious: boolean
): MetricChange {
	if (!hasPrevious) {
		return direction === 'lower-is-better' && value > 0
			? { kind: 'bad', magnitude: value }
			: null;
	}

	if (value === previousValue) return null;

	const rose = value > previousValue;
	const magnitude = Math.abs(value - previousValue);

	if (direction === 'neutral') return { kind: 'neutral', magnitude };

	const roseIsGood = direction === 'higher-is-better';

	return { kind: rose === roseIsGood ? 'good' : 'bad', magnitude };
}

const TONE_TIERS: Record<
	MetricChangeKind,
	{
		base: [string, string, string, string];
		boost: [string, string, string, string];
	}
> = {
	bad: {
		base: [
			'bg-[rgba(249,92,120,0.08)]',
			'bg-[rgba(249,92,120,0.14)]',
			'bg-[rgba(249,92,120,0.22)]',
			'bg-[rgba(249,92,120,0.32)]'
		],
		boost: [
			'bg-[rgba(249,92,120,0.3)]',
			'bg-[rgba(249,92,120,0.42)]',
			'bg-[rgba(249,92,120,0.55)]',
			'bg-[rgba(249,92,120,0.68)]'
		]
	},
	good: {
		base: [
			'bg-[rgba(101,205,132,0.08)]',
			'bg-[rgba(101,205,132,0.14)]',
			'bg-[rgba(101,205,132,0.22)]',
			'bg-[rgba(101,205,132,0.32)]'
		],
		boost: [
			'bg-[rgba(101,205,132,0.3)]',
			'bg-[rgba(101,205,132,0.42)]',
			'bg-[rgba(101,205,132,0.55)]',
			'bg-[rgba(101,205,132,0.68)]'
		]
	},
	neutral: {
		base: [
			'bg-[hsl(40_60%_52%_/_0.05)]',
			'bg-[hsl(40_60%_52%_/_0.09)]',
			'bg-[hsl(40_60%_52%_/_0.14)]',
			'bg-[hsl(40_60%_52%_/_0.20)]'
		],
		boost: [
			'bg-[hsl(40_60%_52%_/_0.20)]',
			'bg-[hsl(40_60%_52%_/_0.27)]',
			'bg-[hsl(40_60%_52%_/_0.35)]',
			'bg-[hsl(40_60%_52%_/_0.44)]'
		]
	}
};

function toneTierClassName(
	magnitude: number,
	kind: MetricChangeKind,
	boost = false
): string {
	const tiers = TONE_TIERS[kind][boost ? 'boost' : 'base'];

	if (magnitude >= 10) return tiers[3];
	if (magnitude >= 5) return tiers[2];
	if (magnitude >= 2) return tiers[1];

	return tiers[0];
}

function getMetricToneClassName(
	direction: RunsProgressTrendDirection,
	value: number,
	previousValue: number,
	hasPrevious: boolean,
	boost = false
): string {
	const change = getMetricChange(direction, value, previousValue, hasPrevious);

	if (!change) return '';

	return toneTierClassName(change.magnitude, change.kind, boost);
}

type MetricDeltaStatus = 'improved' | 'regressed' | 'changed';

type MetricDelta = {
	amount: number;
	increased: boolean;
	title: string;
	status: MetricDeltaStatus;
} | null;

function getMetricDelta(
	value: number,
	previousValue: number,
	direction: RunsProgressTrendDirection
): MetricDelta {
	if (value === previousValue) return null;

	const diff = value - previousValue;
	const sign = diff > 0 ? '+' : '';

	let status: MetricDeltaStatus = 'changed';

	if (direction !== 'neutral') {
		if (value > previousValue) {
			status = direction === 'higher-is-better' ? 'improved' : 'regressed';
		} else {
			status = direction === 'higher-is-better' ? 'regressed' : 'improved';
		}
	}

	const percent =
		previousValue === 0
			? null
			: Math.round(((value - previousValue) / previousValue) * 100);
	const title =
		percent === null
			? `${sign}${diff} vs previous run`
			: `${sign}${diff} (${percent > 0 ? '+' : ''}${percent}%) vs previous run`;

	return {
		amount: Math.abs(diff),
		increased: diff > 0,
		title,
		status
	};
}

function buildFilterSummary(
	searchParams: URLSearchParams
): RunsProgressFilterSummary[] {
	const summary: RunsProgressFilterSummary[] = [];
	const runData = searchParams.get('runData');
	const tagExpr = searchParams.get('tagExpr');
	const calendarMode = searchParams.get('calendarMode');
	const duration = searchParams.get('duration');
	const startDate = searchParams.get('startDate');
	const finishDate = searchParams.get('finishDate');

	if (runData)
		summary.push({ label: 'Metas', value: runData.split(';').join(', ') });
	if (tagExpr) summary.push({ label: 'Tag expression', value: tagExpr });
	if (calendarMode === 'duration' && duration) {
		summary.push({ label: 'Range', value: duration });
	} else if (startDate || finishDate) {
		summary.push({
			label: 'Range',
			value: `${startDate || '...'} - ${finishDate || '...'}`
		});
	}

	return summary;
}

export type { MetricChange, MetricDelta, MetricDeltaStatus };

export {
	buildFilterSummary,
	buildPackageSummaries,
	buildRunsProgressRows,
	filterChangedRows,
	filterRunsByDateWindow,
	getMetadataKey,
	getMetadataKeys,
	getMetricChange,
	getMetricDelta,
	getExpectedTotal,
	getMetricToneClassName,
	getNodeStats,
	getRunGroupValue,
	getRunPackageName,
	getStatsTotal,
	getUnexpectedTotal,
	groupRuns,
	rowHasChange,
	sortRunsNewestFirst,
	toneTierClassName
};
