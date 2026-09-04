/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { QueryParamConfig } from 'use-query-params';
import type { SortingState, VisibilityState } from '@tanstack/react-table';

import {
	DELIMITER,
	PAGE_SIZE_OPTIONS,
	SORT_NONE
} from './classification-table.constants';

function first(value: string | (string | null)[] | null | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

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

/**
 * Column visibility *overrides* — the columns the reader has decided about,
 * not the whole visibility state.
 *
 * `{ tags: false, active: true }` encodes as `-tags;+active`: `-` hidden, `+`
 * shown, keys sorted so the same choice always produces the same URL. An empty
 * override set encodes to `undefined` so the param disappears, which is what
 * lets the table fall back to a default that depends on how much room it has.
 */
export const ColumnsParam: QueryParamConfig<VisibilityState, VisibilityState> = {
	encode: (overrides) => {
		const entries = Object.entries(overrides ?? {}).sort(([a], [b]) =>
			a.localeCompare(b)
		);

		if (!entries.length) return undefined;

		return entries
			.map(([id, visible]) => `${visible ? '+' : '-'}${id}`)
			.join(DELIMITER);
	},
	decode: (value) => {
		const overrides: VisibilityState = {};

		for (const entry of (first(value) ?? '').split(DELIMITER)) {
			const token = entry.trim();
			const sign = token[0];

			if (sign !== '+' && sign !== '-') continue;

			const id = token.slice(1);
			if (id) overrides[id] = sign === '+';
		}

		return overrides;
	}
};
