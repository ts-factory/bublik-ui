/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CellContext, FilterFn } from '@tanstack/react-table';

import { HistoryDataAggregation, ResultData } from '@/shared/types';
import { BadgeListItem } from '@/shared/tailwind-ui';
import type { SelectableResult } from '@/bublik/features/result-classification';

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

/**
 * Whether a group-of-results row passes the table's client-side filter: every
 * picked parameter and verdict among its own, and a verdict group of the
 * picked obtained result, if any.
 */
export function matchesAggregationGlobalFilter(
	data: HistoryDataAggregation,
	filterValue: HistoryAggregationGlobalFilter
): boolean {
	const filterTags = [...filterValue.parameters, ...filterValue.verdicts];
	const verdicts = data.results_by_verdicts.flatMap((result) => result.verdict);
	const allRowTags = [...data.parameters, ...verdicts];

	const resultsMatch =
		filterValue.resultType != null && filterValue.isNotExpected != null
			? data.results_by_verdicts.some(
					(result) =>
						result.result_type === filterValue.resultType &&
						result.has_error === filterValue.isNotExpected
			  )
			: true;

	const containsInTags = filterTags.every((filter) =>
		allRowTags.includes(filter)
	);

	return containsInTags && resultsMatch;
}

export const globalFilterFn: FilterFn<HistoryDataAggregation> = (
	row,
	_columnId,
	filterValue: HistoryAggregationGlobalFilter
) => matchesAggregationGlobalFilter(row.original, filterValue);

/**
 * The results of a verdict group, as the result selection takes them: they
 * share the group's `has_error`, so a group of failures is picked whole and
 * a group of expected results not at all.
 */
export function verdictGroupResults(group: ResultData): SelectableResult[] {
	return group.results_data.map((result) => ({
		result_id: result.result_id,
		run_id: result.run_id,
		has_error: group.has_error
	}));
}

/** Every result of the verdict groups of `rows`, for Select All. */
export function aggregationResults(
	rows: readonly HistoryDataAggregation[]
): SelectableResult[] {
	return rows.flatMap((row) =>
		row.results_by_verdicts.flatMap(verdictGroupResults)
	);
}
