/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import type {
	ExpandedState,
	OnChangeFn,
	VisibilityState
} from '@tanstack/react-table';

import { useSearchWriter } from '@/router';

import { compareSearch } from '@/shared/utils';

/** The `/compare` route, its schema `compareSearch` in `@/shared/utils`. */
const compareRoute = getRouteApi('/_app/_runs/compare');

type CompareTableKey = 'expanded' | 'columnVisibility';

/**
 * A diff table state on the URL: the value on screen (the schema's default
 * when the key is absent or not JSON, as `withDefault(JsonParam)` read it)
 * and a setter that merges it into the current search and replaces the
 * entry. A functional update receives the value on the location the router
 * is at right now, so updates in one handler compose.
 */
function useCompareTableState<T>(key: CompareTableKey): [T, OnChangeFn<T>] {
	const writeSearch = useSearchWriter();
	const value = compareSearch.withDefaults(compareRoute.useSearch())[key] as T;

	const setValue = useCallback<OnChangeFn<T>>(
		(updater) =>
			writeSearch((latest) => ({
				[key]:
					typeof updater === 'function'
						? (updater as (old: T) => T)(
								compareSearch.withDefaults(latest)[key] as T
						  )
						: updater
			})),
		[writeSearch, key]
	);

	return [value, setValue];
}

/** The diff tree's expanded rows (`expanded`); the first row is open by default. */
function useCompareExpanded(): [ExpandedState, OnChangeFn<ExpandedState>] {
	return useCompareTableState('expanded');
}

/** The diff table's columns (`columnVisibility`); TOTAL, RUN and ABNORMAL are hidden by default. */
function useCompareColumnVisibility(): [
	VisibilityState,
	OnChangeFn<VisibilityState>
] {
	return useCompareTableState('columnVisibility');
}

/** The two runs `/compare` names (`left`, `right`); absent or empty when missing. */
function useCompareRunIds(): { left?: string; right?: string } {
	const left = compareRoute.useSearch({ select: (search) => search.left });
	const right = compareRoute.useSearch({ select: (search) => search.right });

	return { left, right };
}

export { useCompareColumnVisibility, useCompareExpanded, useCompareRunIds };
