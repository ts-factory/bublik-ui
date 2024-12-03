/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CellContext, FilterFn } from '@tanstack/react-table';

import { HistoryDataAggregation } from '@/shared/types';
import { BadgeListItem } from '@/shared/tailwind-ui';

import {
	HistoryAggregationGlobalFilter,
	HistoryLinearArrayFilters
} from './history-aggregation.types';

export const getParametersHash = ({
	parameters,
	hash
}: HistoryDataAggregation) => {
	return { parameters: parameters.map((param) => ({ payload: param })), hash };
};

export const onBadgeCellClick =
	(
		cell: CellContext<HistoryDataAggregation, unknown>,
		key: HistoryLinearArrayFilters
	) =>
	(badge: BadgeListItem) => {
		const { table } = cell;
		const globalFilter: HistoryAggregationGlobalFilter =
			table.getState().globalFilter;

		if (globalFilter[key].includes(badge.payload)) {
			table.setGlobalFilter((prev: HistoryAggregationGlobalFilter) => ({
				...prev,
				[key]: prev[key].filter((filterParam) => filterParam !== badge.payload)
			}));
		} else {
			table.setGlobalFilter((prev: HistoryAggregationGlobalFilter) => ({
				...prev,
				[key]: [...prev[key], badge.payload]
			}));
		}
	};

export const globalFilterFn: FilterFn<HistoryDataAggregation> = (
	row,
	_columnId,
	filterValue: HistoryAggregationGlobalFilter
) => {
	const filterTags = [...filterValue.parameters, ...filterValue.verdicts];

	// 1. Row
	const { parameters } = row.original;
	const verdicts = row.original.results_by_verdicts.flatMap(
		(result) => result.verdict
	);
	const allRowTags = [...parameters, ...verdicts];

	// 2. Row result types
	const rowResultTypes = row.original.results_by_verdicts.flatMap((result) => ({
		resultType: result.result_type,
		isNotExpected: result.has_error
	}));

	// 3. Result type
	const resultsMatch =
		filterValue.resultType != null && filterValue.isNotExpected != null
			? rowResultTypes.some(
					({ resultType, isNotExpected }) =>
						resultType === filterValue.resultType &&
						isNotExpected === filterValue.isNotExpected
				)
			: true;

	const containsInTags = filterTags.every((filter) =>
		allRowTags.includes(filter)
	);

	// 4. Substring filter
	const inSubstringFilter = allRowTags.some((tag) =>
		tag.includes(filterValue.substringFilter)
	);

	return containsInTags && resultsMatch && inSubstringFilter;
};
