/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { OnChangeFn } from '@tanstack/react-table';

import { HistoryAggregationGlobalFilter } from './history-aggregation.types';

import { isFunction } from '@/shared/utils';
import { useGetHistoryAggregationQuery } from '@/services/bublik-api';
import type { SelectableResult } from '@/bublik/features/result-classification';

import {
	aggregationResults,
	matchesAggregationGlobalFilter
} from './history-aggregation.utils';
import { selectAggregationGlobalFilter, useHistoryActions } from '../slice';
import { useHistoryQuery } from '../hooks';

export const useAggregationGlobalFilter = () => {
	const actions = useHistoryActions();
	const globalFilter = useSelector(selectAggregationGlobalFilter);

	const handleGlobalFilterChange: OnChangeFn<HistoryAggregationGlobalFilter> =
		useCallback(
			(updaterOrValue) => {
				if (isFunction(updaterOrValue)) {
					const newValue = updaterOrValue(globalFilter);

					actions.updateAggregationGlobalFilter({
						verdicts: newValue.verdicts,
						isNotExpected: newValue.isNotExpected,
						resultType: newValue.resultType,
						parameters: newValue.parameters
					});
				} else {
					actions.updateAggregationGlobalFilter({
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

const NO_RESULTS: SelectableResult[] = [];

/**
 * The results of the group-of-results rows on screen: the page the server
 * sent, narrowed by the table's client-side filter. What the selection
 * popover's Select All picks from. `skip` holds the request back, as for
 * another mode than this one.
 */
export const useHistoryAggregationResultsOnScreen = ({
	skip = false
} = {}): SelectableResult[] => {
	const { query } = useHistoryQuery();
	const state = useLocation().state as { fromRun?: boolean } | null;
	const globalFilter = useSelector(selectAggregationGlobalFilter);
	const { data } = useGetHistoryAggregationQuery(query, {
		skip: skip || state?.fromRun || !query.testName
	});

	return useMemo(
		() =>
			data
				? aggregationResults(
						data.results.filter((row) =>
							matchesAggregationGlobalFilter(row, globalFilter)
						)
				  )
				: NO_RESULTS,
		[data, globalFilter]
	);
};
