/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { SortingState, VisibilityState } from '@tanstack/react-table';
import { z } from 'zod';

import {
	defineSearch,
	num,
	str,
	validated,
	type Codec,
	type Shape,
	type Typed
} from '@/router';
import { config } from '@/bublik/config';

/**
 * The URL state every classification table shares:
 * `/runs/$runId/issues`, `/issues`, `/issues/rules` and `/issues/$issueId`.
 * The codecs mirror the `QueryParamConfig`s of
 * `classification-table.params.ts` in the result-classification lib, minus
 * their defaults: a value the decoder would replace by the default (`page`
 * below 1, a `pageSize` off the menu) reads as absent instead, a default
 * value is omitted from the URL by the writer (`page` when 1, `pageSize` and
 * `sort` when they equal the table's own), and `withDefaults` fills it at
 * read time, never a codec.
 */

const DELIMITER = config.queryDelimiter;
const SORT_NONE = 'none';
const PAGE_SIZES = [10, 25, 50, 75, 100] as const;

/** The facets every rules table offers. */
const RULE_FACETS = [
	'category',
	'disposition',
	'active',
	'tags',
	'verdicts',
	'parameters'
] as const;

/**
 * Absent stays absent, a typed value (an object or array handed in by a
 * navigation) is returned as is, and a wire string is decoded.
 */
function decodeString<T>(
	raw: unknown,
	decode: (text: string) => T | undefined
): T | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (typeof raw === 'object') return raw as T;

	return decode(String(raw));
}

/** The non-blank, trimmed entries of a `;`-joined wire string. */
function splitIds(text: string): string[] {
	return text
		.split(DELIMITER)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

/**
 * A `;`-joined list of ids (a facet's values, the column order); blank
 * entries are dropped on read and an empty list leaves the key off the URL.
 */
function idList(): Codec<string[]> {
	return {
		parse: (raw) =>
			Array.isArray(raw)
				? raw.map(String)
				: decodeString(raw, (text) => splitIds(text)),
		serialize: (value) =>
			value === undefined || !value.length ? undefined : value.join(DELIMITER)
	};
}

/**
 * One column, one direction: `<id>:asc|desc`, or `none` for no sorting.
 * A value without a column id is garbage and reads as absent.
 */
function sorting(): Codec<SortingState> {
	return {
		parse: (raw) =>
			decodeString<SortingState>(raw, (text) => {
				if (text === SORT_NONE) return [];

				const [id, direction] = text.split(':');

				return id ? [{ id, desc: direction === 'desc' }] : undefined;
			}),
		serialize: (value) => {
			if (value === undefined) return undefined;

			const primary = value[0];
			if (!primary) return SORT_NONE;

			return `${primary.id}:${primary.desc ? 'desc' : 'asc'}`;
		}
	};
}

/**
 * The ids of the rows whose sub-row is open, `;`-joined. TanStack's
 * `ExpandedState` also allows `true` (everything); only the record
 * round-trips through a URL, so `true` and an empty record write nothing.
 */
function openRows(): Codec<Record<string, boolean>> {
	return {
		parse: (raw) =>
			raw === true
				? undefined
				: decodeString(raw, (text) =>
						Object.fromEntries(splitIds(text).map((id) => [id, true]))
				  ),
		serialize: (value) => {
			if (value === undefined) return undefined;

			const open = Object.keys(value).filter((id) => value[id]);

			return open.length ? open.join(DELIMITER) : undefined;
		}
	};
}

/**
 * The reader's column visibility overrides: `-tags;+active`, `-` hidden,
 * `+` shown, sorted by id so the same choice always produces the same URL.
 * An empty override set writes nothing, which lets the table fall back to a
 * default that depends on how much room it has.
 */
function columnOverrides(): Codec<VisibilityState> {
	return {
		parse: (raw) =>
			decodeString(raw, (text) => {
				const overrides: VisibilityState = {};

				for (const token of splitIds(text)) {
					const sign = token[0];
					if (sign !== '+' && sign !== '-') continue;

					const id = token.slice(1);
					if (id) overrides[id] = sign === '+';
				}

				return overrides;
			}),
		serialize: (value) => {
			if (value === undefined) return undefined;

			const entries = Object.entries(value).sort(([a], [b]) =>
				a.localeCompare(b)
			);
			if (!entries.length) return undefined;

			return entries
				.map(([id, visible]) => `${visible ? '+' : '-'}${id}`)
				.join(DELIMITER);
		}
	};
}

/** The page a server-paged table is on, shared with the issue results page. */
const PAGING_SHAPE = {
	page: validated(num(), z.number().int().min(1)),
	pageSize: validated(
		num(),
		z
			.number()
			.refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
	)
};

const TABLE_SHAPE = {
	...PAGING_SHAPE,
	q: str(),
	sort: sorting(),
	open: openRows(),
	cols: columnOverrides(),
	order: idList()
};

type TableShape<F extends string> = typeof TABLE_SHAPE &
	Record<F, Codec<string[]>>;

interface ClassificationTableOptions<F extends string, E extends Shape> {
	/** The `;`-joined facet keys this table filters on. */
	facets: readonly F[];
	pageSize: number;
	sort: SortingState;
	/** Keys of what the table hosts, such as a result table under a row. */
	extra?: E;
}

function byFacet<F extends string, V>(
	facets: readonly F[],
	value: () => V
): Record<F, V> {
	const out = {} as Record<F, V>;
	for (const key of facets) out[key] = value();

	return out;
}

/**
 * A classification table's schema: the shared keys plus the table's own
 * facets, with the table's page size and sorting as read-time defaults.
 * `cols` and `order` have no static default: they fall back to localStorage.
 */
function defineClassificationSearch<
	const F extends string,
	E extends Shape = Record<never, never>
>({ facets, pageSize, sort, extra }: ClassificationTableOptions<F, E>) {
	const shape = {
		...TABLE_SHAPE,
		...byFacet(facets, idList),
		...extra
	} as TableShape<F> & E;
	// `Typed<>` maps over the generic facet keys, which TypeScript cannot
	// relate to `Record<F, string[]>` inside the function; the call sites
	// see the resolved type.
	const defaults = {
		page: 1,
		pageSize,
		q: '',
		sort,
		open: {},
		...byFacet(facets, (): string[] => [])
	} as unknown as Typed<TableShape<F> & E>;

	return defineSearch(shape, defaults);
}

export {
	columnOverrides,
	defineClassificationSearch,
	idList,
	openRows,
	PAGING_SHAPE,
	RULE_FACETS,
	sorting
};
