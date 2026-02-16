/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
	useQueryParam,
	JsonParam,
	withDefault,
	NumberParam
} from 'use-query-params';
import {
	ExpandedState,
	Row,
	SortingState,
	Updater,
	VisibilityState
} from '@tanstack/react-table';

import { RunData, MergedRun } from '@/shared/types';
import { useLocalStorage, useMount } from '@/shared/hooks';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { RowStateContextType, RunRowState } from '../hooks';
import { DEFAULT_COLUMN_VISIBILITY } from './constants';
import { skipToken } from '@reduxjs/toolkit/query';

const GlobalFilterParam = withDefault(JsonParam, []);
const RowStateParam = withDefault(JsonParam, {});
const SortingParam = withDefault(JsonParam, []);
const RUN_TABLE_PERSISTED_QUERY_KEYS = [
	'expanded',
	'globalFilter',
	'rowState',
	'columnFilters'
] as const;

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
			? `${parent.id}_${original.result_ids.join(':')}_${original.exec_seqno}`
			: `${original.result_ids.join(':')}_${original.exec_seqno}`;
	}

	const baseId = `${original.result_id}_${original.exec_seqno}`;
	return parent ? `${parent.id}_${baseId}` : baseId;
}

const LOCAL_STORAGE_COLUMN_VISIBILITY_KEY = 'run-column-visibility';

function useColumnVisibility() {
	function getDefaultColumnVisibility(): VisibilityState {
		try {
			const columnVisibility = localStorage.getItem(
				LOCAL_STORAGE_COLUMN_VISIBILITY_KEY
			);

			if (!columnVisibility) return DEFAULT_COLUMN_VISIBILITY;

			return JSON.parse(columnVisibility);
		} catch (_) {
			return DEFAULT_COLUMN_VISIBILITY;
		}
	}

	const [localColumnVisibility, setLocalColumnVisibility] =
		useLocalStorage<VisibilityState>(
			LOCAL_STORAGE_COLUMN_VISIBILITY_KEY,
			getDefaultColumnVisibility()
		);

	const [queryColumnVisibility, setQueryColumnVisibility] =
		useQueryParam<VisibilityState>('visibility', JsonParam);

	useMount(() => {
		if (!Object.keys(queryColumnVisibility ?? {}).length) {
			setQueryColumnVisibility(localColumnVisibility, 'replaceIn');
		}
	});

	const columnVisibility = queryColumnVisibility ?? localColumnVisibility;

	const setColumnVisibility = (
		state: Updater<VisibilityState> | VisibilityState
	): void => {
		const newState =
			typeof state === 'function' ? state(columnVisibility) : state;

		setQueryColumnVisibility(newState, 'replaceIn');
		setLocalColumnVisibility(newState);
	};

	return {
		columnVisibility,
		setColumnVisibility
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

export function migrateExpandedStateUrl(
	oldExpanded: ExpandedState,
	rows: Record<string, Row<RunData | MergedRun>>
) {
	const newExpanded = migrateExpandedState(oldExpanded, rows);
	const currentUrl = new URL(window.location.href);

	try {
		const expandedJson = JSON.stringify(newExpanded);
		currentUrl.searchParams.set('expanded', expandedJson);
	} catch (error) {
		console.error('Failed to stringify expanded state:', error, newExpanded);
	}
}

export function useTargetIterationId() {
	const [targetIterationId, setTargetIterationId] = useQueryParam(
		'targetIterationId',
		NumberParam
	);

	return { targetIterationId, setTargetIterationId };
}

export const useRunTableQueryState = (
	data: RunData[] | MergedRun[] | undefined | null
) => {
	const location = useLocation();
	const navigationState = location.state as {
		openUnexpected?: boolean;
		openUnexpectedResults?: boolean;
		openUnexpectedIntentId?: string;
	};
	const locationState = hasPersistedRunTableState(location.search)
		? undefined
		: navigationState;
	const { targetIterationId } = useTargetIterationId();

	const [expanded, setExpanded] = useQueryParam<ExpandedState>(
		'expanded',
		withDefault(
			JsonParam,
			data && data.length > 0 ? { [getRowId(data[0], 0, undefined)]: true } : {}
		)
	);

	const [sorting, setSorting] = useQueryParam<SortingState>(
		'sorting',
		SortingParam
	);

	const [globalFilter, setGlobalFilter] = useQueryParam<string[]>(
		'globalFilter',
		GlobalFilterParam
	);

	const [rowState, setRowState] = useQueryParam<RunRowState>(
		'rowState',
		RowStateParam
	);
	const rowStateContext = useMemo<RowStateContextType>(
		() => [rowState, setRowState],
		[rowState, setRowState]
	);

	const { setColumnVisibility, columnVisibility } = useColumnVisibility();

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
		setColumnVisibility,
		rowStateContext,
		targetIterationId: targetIterationId ?? undefined
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
