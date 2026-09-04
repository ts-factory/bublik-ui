/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { QueryParamConfig } from 'use-query-params';
import type { SortingState } from '@tanstack/react-table';

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
