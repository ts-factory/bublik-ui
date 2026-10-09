/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { QueryParamConfig } from 'use-query-params';
import type {
	ExpandedState,
	SortingState,
	VisibilityState
} from '@tanstack/react-table';

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

/**
 * A facet over free text — verdicts, tags, parameter values — as one param per
 * value (`?verdicts=a&verdicts=b`), kept exactly as written. `FacetParam`'s
 * `;` join and trim would split a verdict that contains `;` and change one
 * that starts or ends with a space.
 */
export const RepeatedFacetParam: QueryParamConfig<string[], string[]> = {
	encode: (values) => (values?.length ? values : undefined),
	decode: (value) =>
		(Array.isArray(value) ? value : [value]).filter((entry): entry is string =>
			Boolean(entry)
		)
};

/**
 * The ids of the rows whose sub-row is open, `;`-joined like every other list
 * in this URL state.
 *
 * TanStack's `ExpandedState` is `true` (everything) or a `Record<id, boolean>`.
 * Only the record round-trips through a URL — "everything" would name rows that
 * a later page or filter no longer contains — so `true` encodes to nothing.
 */
export const ExpandedParam: QueryParamConfig<ExpandedState, ExpandedState> = {
	encode: (expanded) => {
		if (!expanded || expanded === true) return undefined;

		const open = Object.keys(expanded).filter((id) => expanded[id]);

		return open.length ? open.join(DELIMITER) : undefined;
	},
	decode: (value) => {
		const ids = (first(value) ?? '')
			.split(DELIMITER)
			.map((entry) => entry.trim())
			.filter(Boolean);

		return Object.fromEntries(ids.map((id) => [id, true]));
	}
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
 * A column order as the `;`-joined column ids, left to right.
 *
 * The decoded list is taken as a wish, not a contract: the hook reconciles it
 * against the columns the table has, so an id that is gone, one that is new or
 * a pin out of place in a hand-edited link never reaches the table. An empty
 * order encodes to `undefined`, which is how the default order stays out of
 * the URL.
 */
export const ColumnOrderParam: QueryParamConfig<string[], string[]> = {
	encode: (order) => (order?.length ? order.join(DELIMITER) : undefined),
	decode: (value) =>
		(first(value) ?? '')
			.split(DELIMITER)
			.map((entry) => entry.trim())
			.filter(Boolean)
};

/**
 * Column visibility *overrides* — the columns the reader has decided about,
 * not the whole visibility state.
 *
 * `{ tags: false, active: true }` encodes as `-tags;+active`: `-` hidden, `+`
 * shown, keys sorted so the same choice always produces the same URL. An empty
 * override set encodes to `undefined` so the param disappears, which is what
 * lets the table fall back to a default that depends on how much room it has.
 */
export const ColumnsParam: QueryParamConfig<VisibilityState, VisibilityState> =
	{
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
