/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { SortingState, VisibilityState } from '@tanstack/react-table';
import { z } from 'zod';

import {
	defineSearch,
	num,
	str,
	validated,
	type Codec,
	type SearchSchema,
	type Typed
} from '@/router';

import {
	DELIMITER,
	KEY,
	PAGE_SIZE_OPTIONS,
	SORT_NONE
} from './classification-table.constants';

/**
 * The URL state every classification table shares:
 * `/runs/$runId/issues`, `/issues`, `/issues/rules` and `/issues/$issueId`.
 * One shape of codecs; each table adds its facets and its own defaults.
 *
 * No codec fills a default: a value the table would replace by
 * its default (`page` below 1, a `pageSize` off the menu, a `sort` without a
 * column) reads as absent, and the default is filled at read time. A value
 * equal to the default is never written either: `toTableWire` turns it into
 * an absent key, so `page` 1, the table's `pageSize` and `sort`, an empty
 * search and empty lists stay off the URL.
 */

/** A key repeated on the wire, which the raw codec reads as an array of strings. */
function isRepeatedWire(raw: unknown): raw is string[] {
	return (
		Array.isArray(raw) &&
		raw.length > 0 &&
		raw.every((item) => typeof item === 'string')
	);
}

/**
 * Absent stays absent, a key repeated on the wire is read by its first
 * value (as the old param configs read it), a typed value (an object or
 * array handed in by a navigation) is returned as is, and a wire string is
 * decoded.
 */
function decodeString<T>(
	raw: unknown,
	decode: (text: string) => T | undefined
): T | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (isRepeatedWire(raw)) return decode(raw[0]);
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
 *
 * The column order read back is a wish, not a contract: the hook reconciles
 * it against the columns the table has, so an id that is gone, one that is
 * new or a pin out of place in a hand-edited link never reaches the table.
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
 * round-trips through a URL, since "everything" would name rows a later
 * page or filter no longer contains, so `true` and an empty record write
 * nothing.
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

/**
 * A facet over free text (verdicts, tags, parameter values): one param per
 * value (`?verdicts=a&verdicts=b`), kept exactly as written, since `idList`'s
 * `;` join and trim would split a verdict that contains `;` and change one
 * that starts or ends with a space. Empty values are dropped on read, and no
 * selection leaves the key off the URL.
 */
function repeatedFacet(): Codec<string[]> {
	return {
		parse: (raw) => {
			if (raw === undefined || raw === null) return undefined;

			return (Array.isArray(raw) ? raw : [raw]).filter(
				(entry): entry is string => typeof entry === 'string' && entry !== ''
			);
		},
		serialize: (value) => (value?.length ? value : undefined)
	};
}

const TABLE_SHAPE = {
	[KEY.PAGE]: validated(num(), z.number().int().min(1)),
	[KEY.PAGE_SIZE]: validated(
		num(),
		z
			.number()
			.refine((size) => (PAGE_SIZE_OPTIONS as readonly number[]).includes(size))
	),
	[KEY.SEARCH]: str(),
	[KEY.SORT]: sorting(),
	[KEY.EXPANDED]: openRows(),
	[KEY.COLUMNS]: columnOverrides(),
	[KEY.COLUMN_ORDER]: idList()
};

type TableShape<F extends string> = typeof TABLE_SHAPE &
	Record<F, Codec<string[]>>;

/** The typed URL state of a table, every key filled (`cols` and `order` aside). */
type TableValues<F extends string> = Typed<TableShape<F>>;

interface ClassificationTableOptions<F extends string> {
	/** The facet keys this table filters on, `;`-joined unless repeated. */
	facets: readonly F[];
	/** The facets over free text, one param per value (`repeatedFacet`). */
	repeatedFacets?: readonly F[];
	pageSize: number;
	sort: SortingState;
}

interface ClassificationSearch<F extends string>
	extends SearchSchema<TableShape<F>> {
	/** The table's facet keys, in the order its filters are listed. */
	facets: readonly F[];
	/** The read-time defaults, which a write leaves off the URL. */
	defaults: TableValues<F>;
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
 * The route declares it as its search, and the table reads and writes
 * through the same object.
 */
function defineClassificationSearch<const F extends string>({
	facets,
	repeatedFacets = [],
	pageSize,
	sort
}: ClassificationTableOptions<F>): ClassificationSearch<F> {
	const shape: TableShape<F> = {
		...TABLE_SHAPE,
		...byFacet(facets, idList)
	};
	for (const key of repeatedFacets) shape[key] = repeatedFacet() as never;
	// `Typed<>` maps over the generic facet keys, which TypeScript cannot
	// relate to `Record<F, string[]>` inside the function; the call sites
	// see the resolved type.
	const defaults = {
		[KEY.PAGE]: 1,
		[KEY.PAGE_SIZE]: pageSize,
		[KEY.SEARCH]: '',
		[KEY.SORT]: sort,
		[KEY.EXPANDED]: {},
		...byFacet(facets, (): string[] => [])
	} as unknown as TableValues<F>;

	return { ...defineSearch(shape, defaults), facets, defaults };
}

/**
 * The table's keys of a search, typed and with the defaults filled. The
 * search may be the route's validated one or raw wire strings (a router
 * that does not declare the schema, as in the specs): every codec parses
 * both to the same value. Keys the schema does not declare are left out.
 */
function readTableSearch<F extends string>(
	schema: ClassificationSearch<F>,
	search: Record<string, unknown>
): TableValues<F> {
	const shape: Record<string, Codec<unknown>> = schema.shape;
	const values: Record<string, unknown> = {};

	for (const key in shape) {
		if (key in search) values[key] = shape[key].parse(search[key]);
	}

	return schema.withDefaults(values as TableValues<F>) as TableValues<F>;
}

/**
 * Typed changes as the wire strings a write merges into the URL: a value
 * equal to the table's default, like an empty one, becomes `undefined`
 * (the key is removed), as the old param configs' `encode` did. Wire
 * strings are what every router stringifies the same way, and the route's
 * middleware turns them back into the same bytes.
 */
function toTableWire<F extends string>(
	schema: ClassificationSearch<F>,
	changes: Record<string, unknown>
): Record<string, string | string[] | undefined> {
	const shape: Record<string, Codec<unknown>> = schema.shape;
	const defaults: Record<string, unknown> = schema.defaults;
	const wire: Record<string, string | string[] | undefined> = {};

	for (const [key, value] of Object.entries(changes)) {
		const codec = shape[key];
		if (!codec) continue;

		const encoded = codec.serialize(value);
		const fallback = codec.serialize(defaults[key]);

		wire[key] =
			encoded === undefined || sameWire(encoded, fallback)
				? undefined
				: encoded;
	}

	return wire;
}

function sameWire(
	a: string | string[] | undefined,
	b: string | string[] | undefined
): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export {
	columnOverrides,
	defineClassificationSearch,
	idList,
	openRows,
	readTableSearch,
	repeatedFacet,
	sorting,
	toTableWire
};
export type {
	ClassificationSearch,
	ClassificationTableOptions,
	TableShape,
	TableValues
};
