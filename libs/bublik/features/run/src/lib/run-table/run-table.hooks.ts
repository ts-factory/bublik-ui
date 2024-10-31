/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryParam, JsonParam, withDefault } from 'use-query-params';
import {
	ExpandedState,
	SortingState,
	Updater,
	VisibilityState
} from '@tanstack/react-table';

import { useLocalStorage } from '@/shared/hooks';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';

import { RowStateContextType, RunRowState } from '../hooks';
import { DEFAULT_COLUMN_VISIBILITY } from './constants';

const GlobalFilterParam = withDefault(JsonParam, []);
const ExpandedParam = withDefault(JsonParam, { '0': true });
const RowStateParam = withDefault(JsonParam, {});

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

	const ColumnVisibilityParam = withDefault(
		JsonParam,
		getDefaultColumnVisibility()
	);

	const [localColumnVisibility, setLocalColumnVisibility] =
		useLocalStorage<VisibilityState>(
			LOCAL_STORAGE_COLUMN_VISIBILITY_KEY,
			getDefaultColumnVisibility()
		);
	const [queryColumnVisibility, seQueryColumnVisibility] =
		useQueryParam<VisibilityState>('visibility', ColumnVisibilityParam);

	const columnVisibility = Object.keys(queryColumnVisibility).length
		? queryColumnVisibility
		: localColumnVisibility;

	const setColumnVisibility = (
		state: Updater<VisibilityState> | VisibilityState
	): void => {
		const newState =
			typeof state === 'function' ? state(columnVisibility) : state;

		seQueryColumnVisibility(newState, 'replace');
		setLocalColumnVisibility(newState);
	};

	return {
		columnVisibility,
		setColumnVisibility
	};
}

export const useRunTableQueryState = () => {
	const locationState = useLocation().state as {
		openUnexpected?: boolean;
		openUnexpectedResults?: boolean;
	};

	const [expanded, setExpanded] = useQueryParam<ExpandedState>(
		'expanded',
		ExpandedParam
	);

	const [sorting, setSorting] = useQueryParam<SortingState>(
		'sorting',
		JsonParam
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
		rowStateContext
	};
};

export type useRunPageNameConfig = {
	runId: string | string[];
};

export const useRunPageName = ({ runId }: useRunPageNameConfig) => {
	const { data: details } = useGetRunDetailsQuery(
		Array.isArray(runId) ? runId[0] : runId
	);

	useEffect(() => {
		if (Array.isArray(runId)) {
			document.title = `${runId.join(' | ')} - Runs - Multiple - Bublik`;

			return;
		}

		if (!details) {
			document.title = 'Run - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);

		document.title = `${name} | ${formattedTime} | ${runId} | Run - Bublik`;
	}, [details, runId]);
};
