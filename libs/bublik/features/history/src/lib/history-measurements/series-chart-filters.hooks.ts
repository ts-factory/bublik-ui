/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';

import { useSearchWriter } from '@/router';

import { useHistorySearch } from '../hooks';

/**
 * The series charts' Charts and Parameters filters, `parametersByResultName`
 * and `parametersByResultFilter`: one key per picked value, merged into the
 * current search with the entry replaced (they were `use-query-params` keys).
 * Clearing a filter removes its key.
 */
function useSeriesChartFilters() {
	const selectedByName = useHistorySearch(
		(search) => search.parametersByResultName ?? []
	);
	const selectedByParam = useHistorySearch(
		(search) => search.parametersByResultFilter ?? []
	);
	const writeSearch = useSearchWriter();

	const setSelectedByName = useCallback(
		(values: string[] | undefined) =>
			writeSearch({ parametersByResultName: values }),
		[writeSearch]
	);
	const setSelectedByParam = useCallback(
		(values: string[] | undefined) =>
			writeSearch({ parametersByResultFilter: values }),
		[writeSearch]
	);

	return {
		selectedByName,
		selectedByParam,
		setSelectedByName,
		setSelectedByParam
	};
}

export { useSeriesChartFilters };
