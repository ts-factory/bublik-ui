/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CellContext, FilterFn } from '@tanstack/react-table';

import { HistoryDataLinear, RESULT_TYPE } from '@/shared/types';
import { BadgeListItem, VerdictListProps } from '@/shared/tailwind-ui';

import { RunTimeProps } from './column-components';
import { ArrayKeys, HistoryLinearGlobalFilter } from './history-linear.types';

export const getTags = (data: HistoryDataLinear): BadgeListItem[] => {
	const tags = data.relevant_tags.map((tag) => ({ payload: tag }));
	const importantTags = data.important_tags.map((importantTag) => ({
		payload: importantTag,
		isImportant: true
	}));

	return [...importantTags, ...tags];
};
export const getTime = (data: HistoryDataLinear): RunTimeProps => {
	return {
		dateTime: data.start_date,
		duration: data.duration
	};
};

export const getObtainedResult = (
	data: HistoryDataLinear
): Partial<VerdictListProps> => {
	return {
		isNotExpected: data.has_error,
		result: data.obtained_result.result_type,
		verdicts: data.obtained_result.verdicts
	};
};

/**
 * Whether a linear row passes the table's client-side filter: every picked
 * badge among its tags, metadata, parameters and verdicts, and the picked
 * obtained result, if any.
 */
export function matchesLinearGlobalFilter(
	data: HistoryDataLinear,
	filterValue: HistoryLinearGlobalFilter
): boolean {
	const filter = [
		...filterValue.tags,
		...filterValue.verdicts,
		...filterValue.parameters
	];

	const allTags = [
		...data.relevant_tags,
		...data.important_tags,
		...data.metadata,
		...data.parameters,
		...data.obtained_result.verdicts
	];

	// 1. Badge filter
	const containsAll = filter.every((filteredTag) =>
		allTags.includes(filteredTag)
	);

	// 2. Result type filter
	const resultsMatch =
		filterValue.resultType != null && filterValue.isNotExpected != null
			? data.obtained_result.result_type === filterValue.resultType &&
			  data.has_error === filterValue.isNotExpected
			: true;

	return containsAll && resultsMatch;
}

export const globalFilterFn: FilterFn<HistoryDataLinear> = (
	row,
	_columnId,
	filterValue: HistoryLinearGlobalFilter
) => matchesLinearGlobalFilter(row.original, filterValue);

export const onBadgeClick =
	(cell: CellContext<HistoryDataLinear, unknown>, keyToUpdate: ArrayKeys) =>
	(badge: string | BadgeListItem) => {
		const table = cell.table;
		const globalFilter: HistoryLinearGlobalFilter =
			cell.table.getState().globalFilter;

		let badgeValue: string;
		if (typeof badge === 'string') {
			badgeValue = badge;
		} else {
			badgeValue = badge.payload;
		}

		if (globalFilter[keyToUpdate].includes(badgeValue)) {
			table.setGlobalFilter({
				...globalFilter,
				[keyToUpdate]: globalFilter[keyToUpdate].filter(
					(old) => old !== badgeValue
				)
			});
		} else {
			table.setGlobalFilter({
				...globalFilter,
				[keyToUpdate]: [...globalFilter[keyToUpdate], badgeValue]
			});
		}
	};

export const onResultTypeClick =
	<
		D,
		T extends { resultType: null | RESULT_TYPE; isNotExpected: boolean | null }
	>(
		cell: CellContext<D, unknown>
	) =>
	(resultType: RESULT_TYPE, isNotExpected?: boolean) => {
		const table = cell.table;
		const globalFilter: T = table.getState().globalFilter;

		if (
			globalFilter.resultType === resultType &&
			globalFilter.isNotExpected === isNotExpected
		) {
			table.setGlobalFilter((prev: T) => ({
				...prev,
				resultType: null,
				isNotExpected: null
			}));
		} else {
			table.setGlobalFilter((prev: T) => ({
				...prev,
				resultType,
				isNotExpected
			}));
		}
	};
