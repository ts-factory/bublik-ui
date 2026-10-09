/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import type {
	ExpandedState,
	OnChangeFn,
	VisibilityState
} from '@tanstack/react-table';

import { json, useSearchWriter } from '@/router';

/**
 * The `/compare` route. Its schema lives with the route file
 * (`apps/bublik/src/routes/-search/compare.search.ts`): `left` and `right`
 * are raw run ids, `expanded` and `columnVisibility` plain JSON (not
 * compressed), defaulted at read time.
 */
const compareRoute = getRouteApi('/_app/_runs/compare');

const DEFAULT_EXPANDED: ExpandedState = { '0': true };

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	TOTAL_LEFT: false,
	TOTAL_RIGHT: false,
	RUN_LEFT: false,
	RUN_RIGHT: false,
	ABNORMAL_LEFT: false,
	ABNORMAL_RIGHT: false
};

type CompareTableKey = 'expanded' | 'columnVisibility';

/** The route's decoding of a JSON key, for the value on the latest location. */
const jsonCodec = json();

/**
 * A diff table state on the URL: the value on screen (its default when the
 * key is absent or not JSON, as `withDefault(JsonParam)` read it) and a
 * setter that merges it into the current search and replaces the entry. A
 * functional update receives the value on the location the router is at
 * right now, so updates in one handler compose.
 */
function useCompareTableState<T>(
	key: CompareTableKey,
	defaultValue: T
): [T, OnChangeFn<T>] {
	const writeSearch = useSearchWriter();
	const value = (compareRoute.useSearch()[key] ?? defaultValue) as T;

	const setValue = useCallback<OnChangeFn<T>>(
		(updater) =>
			writeSearch((latest) => ({
				[key]:
					typeof updater === 'function'
						? (updater as (old: T) => T)(
								(jsonCodec.parse(latest[key]) ?? defaultValue) as T
						  )
						: updater
			})),
		[writeSearch, key, defaultValue]
	);

	return [value, setValue];
}

/** The diff tree's expanded rows (`expanded`); the first row is open by default. */
function useCompareExpanded(): [ExpandedState, OnChangeFn<ExpandedState>] {
	return useCompareTableState('expanded', DEFAULT_EXPANDED);
}

/** The diff table's columns (`columnVisibility`); TOTAL, RUN and ABNORMAL are hidden by default. */
function useCompareColumnVisibility(): [
	VisibilityState,
	OnChangeFn<VisibilityState>
] {
	return useCompareTableState('columnVisibility', DEFAULT_COLUMN_VISIBILITY);
}

/** The two runs `/compare` names (`left`, `right`); absent or empty when missing. */
function useCompareRunIds(): { left?: string; right?: string } {
	const left = compareRoute.useSearch({ select: (search) => search.left });
	const right = compareRoute.useSearch({ select: (search) => search.right });

	return { left, right };
}

export { useCompareColumnVisibility, useCompareExpanded, useCompareRunIds };
