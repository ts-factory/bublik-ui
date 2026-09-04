/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { QueryParamConfig } from 'use-query-params';
import type { SortingState } from '@tanstack/react-table';

import {
	DELIMITER,
	PAGE_SIZE_OPTIONS,
	SORT_NONE
} from './classification-table.constants';

/**
 * The `use-query-params` codecs behind the table's URL state.
 *
 * Two rules govern every one of them:
 *
 * 1. **Defaults are absent, not written.** An encoder returns `undefined` for a
 *    value equal to its default, and `use-query-params` drops the key rather
 *    than serialising it. Page 1 and the default page size never appear, so
 *    the canonical view of a table is its bare path and a shared link carries
 *    only what was actually changed.
 * 2. **The URL contract is flat and readable** — `?page=2&sort=created:desc&
 *    state=open;closed` rather than a JSON blob. It has to be: the sidebar
 *    stores these exact keys in its compressed `_s` breadcrumb
 *    (`stripSidebarParamsFromUrl`), and old shared links have to keep
 *    resolving.
 *
 * Writes go out as `replaceIn`, which merges into the existing query string
 * instead of rebuilding it. That is what preserves the multi-valued `project`
 * key the global project selector owns and reads with `getAll`.
 */

function first(value: string | (string | null)[] | null | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

/** 1-based in the URL, as DRF counts pages; page 1 is never written. */
export const PageParam: QueryParamConfig<number, number> = {
	encode: (page) => (page <= 1 ? undefined : String(page)),
	decode: (value) => {
		const page = Number(first(value));

		return Number.isFinite(page) && page >= 1 ? page : 1;
	}
};

export function createPageSizeParam(
	defaultPageSize: number
): QueryParamConfig<number, number> {
	return {
		encode: (pageSize) =>
			pageSize === defaultPageSize ? undefined : String(pageSize),
		decode: (value) => {
			const pageSize = Number(first(value));

			return PAGE_SIZE_OPTIONS.includes(
				pageSize as (typeof PAGE_SIZE_OPTIONS)[number]
			)
				? pageSize
				: defaultPageSize;
		}
	};
}

export const SearchParam: QueryParamConfig<string, string> = {
	encode: (search) => search || undefined,
	decode: (value) => first(value) ?? ''
};

/**
 * A `;`-joined list under one key. The library ships `DelimitedArrayParam`, but
 * it is comma-only — the rest of the app joins on `config.queryDelimiter`.
 */
export const FacetParam: QueryParamConfig<string[], string[]> = {
	encode: (values) => (values?.length ? values.join(DELIMITER) : undefined),
	decode: (value) =>
		(first(value) ?? '')
			.split(DELIMITER)
			.map((entry) => entry.trim())
			.filter(Boolean)
};

export function serializeSorting(sorting: SortingState): string {
	const primary = sorting[0];
	if (!primary) return SORT_NONE;

	return `${primary.id}:${primary.desc ? 'desc' : 'asc'}`;
}

export function parseSorting(
	raw: string | null | undefined,
	fallback: SortingState
): SortingState {
	if (raw === null || raw === undefined) return fallback;
	if (raw === SORT_NONE) return [];

	const [id, direction] = raw.split(':');
	if (!id) return fallback;

	return [{ id, desc: direction === 'desc' }];
}

export function sameSorting(a: SortingState, b: SortingState): boolean {
	return serializeSorting(a) === serializeSorting(b);
}

/**
 * Single-column, `<id>:asc|desc`. `none` is the sentinel for "explicitly
 * unsorted" — without it, clearing the sort would drop the key and read back
 * as the default on the next render.
 */
export function createSortingParam(
	defaultSorting: SortingState
): QueryParamConfig<SortingState, SortingState> {
	return {
		encode: (sorting) =>
			sameSorting(sorting, defaultSorting)
				? undefined
				: serializeSorting(sorting),
		decode: (value) => parseSorting(first(value), defaultSorting)
	};
}
