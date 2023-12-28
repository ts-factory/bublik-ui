/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryParam, JsonParam, withDefault } from 'use-query-params';
import {
	ExpandedState,
	SortingState,
	VisibilityState
} from '@tanstack/react-table';

import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';

import { RowStateContextType, RunRowState } from '../hooks';
import { DEFAULT_COLUMN_VISIBILITY } from './constants';

const GlobalFilterParam = withDefault(JsonParam, []);
const ExpandedParam = withDefault(JsonParam, { '0': true });
const RowStateParam = withDefault(JsonParam, {});
const ColumnVisibilityParam = withDefault(JsonParam, DEFAULT_COLUMN_VISIBILITY);

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

	const [columnVisibility, setColumnVisibility] =
		useQueryParam<VisibilityState>('visibility', ColumnVisibilityParam);

	const [rowState, setRowState] = useQueryParam<RunRowState>(
		'rowState',
		RowStateParam
	);
	const rowStateContext = useMemo<RowStateContextType>(
		() => [rowState, setRowState],
		[rowState, setRowState]
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
		setColumnVisibility,
		rowStateContext
	};
};

export type useRunPageNameConfig = {
	runId: string;
};

export const useRunPageName = ({ runId }: useRunPageNameConfig) => {
	const { data: details } = useGetRunDetailsQuery(runId);

	useEffect(() => {
		if (!details) {
			document.title = 'Run - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);

		document.title = `${name} | ${formattedTime} | ${runId} | Run - Bublik`;
	}, [details, runId]);
};
