/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { OnChangeFn } from '@tanstack/react-table';

import { isFunction } from '@/shared/utils';
import { useGetHistoryLinearQuery } from '@/services/bublik-api';
import type { HistoryDataLinear } from '@/shared/types';

import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { HistoryLinearGlobalFilter } from './history-linear.types';
import { matchesLinearGlobalFilter } from './history-linear.utils';
import { selectLinearGlobalFilter, useHistoryActions } from '../slice';
import { useHistoryQuery } from '../hooks';

export const useHistoryLinearGlobalFilter = () => {
	const actions = useHistoryActions();
	const globalFilter = useSelector(selectLinearGlobalFilter);

	const handleGlobalFilterChange: OnChangeFn<HistoryLinearGlobalFilter> =
		useCallback(
			(updaterOrValue) => {
				if (isFunction(updaterOrValue)) {
					const newValue = updaterOrValue(globalFilter);

					actions.updateLinearGlobalFilter({
						tags: newValue.tags,
						verdicts: newValue.verdicts,
						isNotExpected: newValue.isNotExpected,
						resultType: newValue.resultType,
						parameters: newValue.parameters
					});
				} else {
					actions.updateLinearGlobalFilter({
						tags: updaterOrValue.tags,
						verdicts: updaterOrValue.verdicts,
						isNotExpected: updaterOrValue.isNotExpected,
						resultType: updaterOrValue.resultType,
						parameters: updaterOrValue.parameters
					});
				}
			},
			[actions, globalFilter]
		);

	return { globalFilter, handleGlobalFilterChange };
};

export const useHistoryLinearTitle = (config: { testName?: string }) => {
	useTabTitleWithPrefix([config?.testName, 'Linear - History - Bublik']);
};

/**
 * The linear history the URL asks for: one page of it, as the server cuts it.
 * `skip` holds the request back, as for another mode than linear.
 */
export const useHistoryLinearData = ({ skip = false } = {}) => {
	const { query } = useHistoryQuery();
	const state = useLocation().state as { fromRun?: boolean } | null;
	const result = useGetHistoryLinearQuery(query, {
		skip: skip || state?.fromRun || !query.testName
	});

	return { query, ...result };
};

const NO_ROWS: HistoryDataLinear[] = [];

/**
 * The linear rows on screen: the page the server sent, narrowed by the
 * table's client-side filter. What the selection popover's Select All picks
 * from. `skip` holds the request back, as for another mode than linear.
 */
export const useHistoryLinearRowsOnScreen = ({
	skip = false
} = {}): HistoryDataLinear[] => {
	const { data } = useHistoryLinearData({ skip });
	const globalFilter = useSelector(selectLinearGlobalFilter);
	const rows = data?.results ?? NO_ROWS;

	return useMemo(
		() => rows.filter((row) => matchesLinearGlobalFilter(row, globalFilter)),
		[rows, globalFilter]
	);
};
