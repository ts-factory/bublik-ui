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

import { RunData, MergedRun, RunStatsColumn } from '@/shared/types';
import { useLocalStorage } from '@/shared/hooks';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { RowStateContextType, RunRowState } from '../hooks';
import { createDefaultColumnVisibility } from './constants';
import { skipToken } from '@reduxjs/toolkit/query';

const GlobalFilterParam = withDefault(JsonParam, []);
const RowStateParam = withDefault(JsonParam, {});
const SortingParam = withDefault(JsonParam, []);

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

	const [queryColumnVisibility, setQueryColumnVisibility] =
		useQueryParam<VisibilityState>('visibility', JsonParam);

	const hasQueryColumnVisibility = hasColumnVisibility(queryColumnVisibility);
	const hasLocalColumnVisibility = hasStoredColumnVisibility(
		columnVisibilityStorageKey,
		localColumnVisibility
	);
	const columnVisibility = hasQueryColumnVisibility
		? queryColumnVisibility
		: hasLocalColumnVisibility
		? localColumnVisibility
		: defaultColumnVisibility;

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
		defaultColumnVisibility,
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
	data: RunData[] | MergedRun[] | undefined | null,
	defaultColumns?: RunStatsColumn[],
	projectId?: number
) => {
	const locationState = useLocation().state as {
		openUnexpected?: boolean;
		openUnexpectedResults?: boolean;
	};
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

	const { setColumnVisibility, columnVisibility, defaultColumnVisibility } =
		useColumnVisibility(defaultColumns, projectId);

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
