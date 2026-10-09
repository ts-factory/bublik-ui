/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import {
	ExpandedState,
	Row,
	SortingState,
	Updater,
	VisibilityState
} from '@tanstack/react-table';
import { skipToken } from '@reduxjs/toolkit/query';

import { useRenderedLocation } from '@/router';
import { RunData, MergedRun, RunStatsColumn } from '@/shared/types';
import { useLocalStorage } from '@/shared/hooks';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { RowStateContextType, RunRowState } from '../hooks';
import { useRunTableSetter, useRunTableValue } from '../run-search.hooks';
import {
	createDefaultColumnOrder,
	createDefaultColumnVisibility,
	reconcileColumnOrder
} from './constants';
import { ColumnId } from './types';

const RUN_TABLE_PERSISTED_QUERY_KEYS = [
	'expanded',
	'globalFilter',
	'rowState',
	'columnFilters'
] as const;

const NO_SORTING: SortingState = [];
const NO_GLOBAL_FILTER: string[] = [];
const NO_ROW_STATE: RunRowState = {};

export function hasPersistedRunTableState(search: string): boolean {
	const searchParams = new URLSearchParams(search);

	return RUN_TABLE_PERSISTED_QUERY_KEYS.some((key) => searchParams.has(key));
}

export function getRowId(
	original: RunData | MergedRun,
	_idx: number,
	parent: Row<RunData | MergedRun> | undefined
) {
	if ('result_ids' in original) {
		return parent
			? `${parent.id}_${original.test_id}_${original.exec_seqno}`
			: `${original.test_id}_${original.exec_seqno}`;
	}

	const baseId = `${original.result_id}_${original.exec_seqno}`;
	return parent ? `${parent.id}_${baseId}` : baseId;
}

const LOCAL_STORAGE_COLUMN_VISIBILITY_KEY = 'run-column-visibility';

function getColumnVisibilityStorageKey(projectId?: number): string {
	return projectId === undefined
		? LOCAL_STORAGE_COLUMN_VISIBILITY_KEY
		: `${LOCAL_STORAGE_COLUMN_VISIBILITY_KEY}:${projectId}`;
}

function hasColumnVisibility(
	value: VisibilityState | null | undefined
): boolean {
	return Object.keys(value ?? {}).length > 0;
}

function hasStoredColumnVisibility(
	key: string,
	value: VisibilityState
): boolean {
	try {
		return localStorage.getItem(key) !== null && hasColumnVisibility(value);
	} catch (_) {
		return false;
	}
}

function useColumnVisibility(
	defaultColumns?: RunStatsColumn[],
	projectId?: number
) {
	const columnVisibilityStorageKey = getColumnVisibilityStorageKey(projectId);
	const defaultColumnVisibility = useMemo(
		() => createDefaultColumnVisibility(defaultColumns),
		[defaultColumns]
	);

	function getLocalColumnVisibility(): VisibilityState {
		try {
			const columnVisibility = localStorage.getItem(columnVisibilityStorageKey);

			if (!columnVisibility) return defaultColumnVisibility;

			return JSON.parse(columnVisibility);
		} catch (_) {
			return defaultColumnVisibility;
		}
	}

	const [localColumnVisibility, setLocalColumnVisibility] =
		useLocalStorage<VisibilityState>(
			columnVisibilityStorageKey,
			getLocalColumnVisibility()
		);

	const queryColumnVisibility = useRunTableValue('visibility');
	const setQueryColumnVisibility = useRunTableSetter('visibility');

	const hasLocalColumnVisibility = hasStoredColumnVisibility(
		columnVisibilityStorageKey,
		localColumnVisibility
	);
	const columnVisibility =
		queryColumnVisibility && hasColumnVisibility(queryColumnVisibility)
			? queryColumnVisibility
			: hasLocalColumnVisibility
			? localColumnVisibility
			: defaultColumnVisibility;

	const setColumnVisibility = (
		state: Updater<VisibilityState> | VisibilityState
	): void => {
		const newState =
			typeof state === 'function' ? state(columnVisibility) : state;

		setQueryColumnVisibility(newState);
		setLocalColumnVisibility(newState);
	};

	return {
		columnVisibility,
		defaultColumnVisibility,
		setColumnVisibility
	};
}

const LOCAL_STORAGE_COLUMN_ORDER_KEY = 'run-column-order';

function getColumnOrderStorageKey(projectId?: number): string {
	return projectId === undefined
		? LOCAL_STORAGE_COLUMN_ORDER_KEY
		: `${LOCAL_STORAGE_COLUMN_ORDER_KEY}:${projectId}`;
}

function hasColumnOrder(value: ColumnId[] | null | undefined): boolean {
	return Array.isArray(value) && value.length > 0;
}

function hasStoredColumnOrder(key: string, value: ColumnId[]): boolean {
	try {
		return localStorage.getItem(key) !== null && hasColumnOrder(value);
	} catch (_) {
		return false;
	}
}

function useColumnOrder(defaultColumns?: RunStatsColumn[], projectId?: number) {
	const columnOrderStorageKey = getColumnOrderStorageKey(projectId);
	const defaultColumnOrder = useMemo(
		() => createDefaultColumnOrder(defaultColumns),
		[defaultColumns]
	);

	function getLocalColumnOrder(): ColumnId[] {
		try {
			const columnOrder = localStorage.getItem(columnOrderStorageKey);

			if (!columnOrder) return defaultColumnOrder;

			return JSON.parse(columnOrder);
		} catch (_) {
			return defaultColumnOrder;
		}
	}

	const [localColumnOrder, setLocalColumnOrder] = useLocalStorage<ColumnId[]>(
		columnOrderStorageKey,
		getLocalColumnOrder()
	);

	// Plain JSON on the wire, unlike the other table states.
	const queryColumnOrder = useRunTableValue('columnOrder') as
		| ColumnId[]
		| undefined;
	const setQueryColumnOrder = useRunTableSetter('columnOrder');

	const hasLocalColumnOrder = hasStoredColumnOrder(
		columnOrderStorageKey,
		localColumnOrder
	);
	const resolvedColumnOrder =
		queryColumnOrder && hasColumnOrder(queryColumnOrder)
			? queryColumnOrder
			: hasLocalColumnOrder
			? localColumnOrder
			: defaultColumnOrder;

	const columnOrder = useMemo(
		() => reconcileColumnOrder(resolvedColumnOrder, defaultColumnOrder),
		[resolvedColumnOrder, defaultColumnOrder]
	);

	const setColumnOrder = (state: Updater<ColumnId[]> | ColumnId[]): void => {
		const newState = typeof state === 'function' ? state(columnOrder) : state;

		setQueryColumnOrder(newState);
		setLocalColumnOrder(newState);
	};

	return {
		columnOrder,
		defaultColumnOrder,
		setColumnOrder
	};
}

export function migrateExpandedState(
	expanded: Record<string, boolean> | true,
	allRows: Record<string, Row<RunData | MergedRun>>
): Record<string, boolean> | boolean {
	const newExpanded: Record<string, boolean> = {};

	if (typeof expanded === 'boolean') {
		return expanded;
	}

	Object.keys(expanded).forEach((key) => {
		const row = allRows[key];

		if (!row) return;

		const newRowId = getRowId(row.original, row.index, row.getParentRow());

		const rowExpanded: boolean = expanded[key];

		newExpanded[newRowId] = rowExpanded;
	});

	return newExpanded;
}

export function shouldMigrateExpandedState(expanded: ExpandedState): boolean {
	return Object.keys(expanded).some((key) => key.includes('.'));
}

/**
 * The iteration a link opened the run at (`targetIterationId`),
 * and its setter (replace, merge; `null` removes it).
 */
export function useTargetIterationId() {
	const targetIterationId = useRunTableValue('targetIterationId');
	const setTargetIterationId = useRunTableSetter('targetIterationId');

	return { targetIterationId, setTargetIterationId };
}

/** The one-shot intents a link to the run passes in `location.state`. */
export interface RunTableLocationState {
	openUnexpected?: boolean;
	openUnexpectedResults?: boolean;
	openUnexpectedIntentId?: string;
}

export const useRunTableQueryState = (
	data: RunData[] | MergedRun[] | undefined | null,
	defaultColumns?: RunStatsColumn[],
	projectId?: number
) => {
	// The page on screen: a page that is being left must not act on the
	// state of the next one.
	const location = useRenderedLocation();
	const navigationState: RunTableLocationState = location.state;
	// A fresh navigation carries a unique openUnexpectedIntentId; always honor
	// it even when the target URL already has persisted table params. Only the
	// legacy (id-less) booleans are suppressed in that case, since they cannot
	// be distinguished from a reload of an already-interacted-with table.
	const hasFreshIntent = Boolean(navigationState?.openUnexpectedIntentId);
	const locationState =
		hasFreshIntent || !hasPersistedRunTableState(location.searchStr)
			? navigationState
			: undefined;
	const { targetIterationId } = useTargetIterationId();
	const resultFilter = useRunTableValue('resultFilter');

	// A legacy plain-JSON value of a compressed key (a link written before
	// the table state was compressed) is read as is and rewritten compressed
	// by the router, with replace, as the page loads; the dotted
	// legacy row ids of `expanded` are migrated by the table once it has rows.
	const defaultExpanded = useMemo<ExpandedState>(
		() =>
			data && data.length > 0
				? { [getRowId(data[0], 0, undefined)]: true }
				: {},
		[data]
	);
	const expanded = useRunTableValue('expanded') ?? defaultExpanded;
	const setExpanded = useRunTableSetter('expanded', defaultExpanded);

	const sorting = useRunTableValue('sorting') ?? NO_SORTING;
	const setSorting = useRunTableSetter('sorting', NO_SORTING);

	const globalFilter = useRunTableValue('globalFilter') ?? NO_GLOBAL_FILTER;
	const setGlobalFilter = useRunTableSetter('globalFilter', NO_GLOBAL_FILTER);

	const rowState = (useRunTableValue('rowState') ??
		NO_ROW_STATE) as RunRowState;
	const setRowState = useRunTableSetter('rowState', NO_ROW_STATE);
	const rowStateContext = useMemo<RowStateContextType>(
		() => [rowState, setRowState],
		[rowState, setRowState]
	);

	const { setColumnVisibility, columnVisibility, defaultColumnVisibility } =
		useColumnVisibility(defaultColumns, projectId);

	const { columnOrder, defaultColumnOrder, setColumnOrder } = useColumnOrder(
		defaultColumns,
		projectId
	);

	return {
		locationState,
		expanded,
		setExpanded,
		sorting,
		setSorting,
		globalFilter,
		setGlobalFilter,
		rowState,
		setRowState,
		columnVisibility,
		defaultColumnVisibility,
		setColumnVisibility,
		columnOrder,
		defaultColumnOrder,
		setColumnOrder,
		rowStateContext,
		targetIterationId,
		resultColumnId: resultFilter
	};
};

export type useRunPageNameConfig = {
	runId: string | string[];
};

export const useRunPageName = ({ runId }: useRunPageNameConfig) => {
	const singleRunId = Array.isArray(runId) ? runId[0] : runId;
	const { data: details } = useGetRunDetailsQuery(singleRunId ?? skipToken);

	let title: string;
	if (Array.isArray(runId)) {
		title = `${runId.join(' | ')} - Runs - Multiple - Bublik`;
	} else if (!details) {
		title = 'Run - Bublik';
	} else {
		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);
		title = `${name} | ${formattedTime} | ${runId} | Run - Bublik`;
	}

	useTabTitleWithPrefix(title);
};
