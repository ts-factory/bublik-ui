/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { OnChangeFn } from '@tanstack/react-table';

import { HistoryAggregationGlobalFilter } from './history-aggregation.types';

import { isFunction } from '@/shared/utils';
import { selectAggregationGlobalFilter, useHistoryActions } from '../slice';

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
