/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { OnChangeFn } from '@tanstack/react-table';

import { isFunction } from '@/shared/utils';

import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { HistoryLinearGlobalFilter } from './history-linear.types';
import { selectLinearGlobalFilter, useHistoryActions } from '../slice';

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
