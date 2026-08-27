/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { FilterFn, Row } from '@tanstack/react-table';

/**
 * The filtering and faceting the three classification tables share.
 *
 * All three had their own copy of each of these. They are identical in
 * behaviour and were drifting only in which fields the free-text search looked
 * at, which is the one thing worth keeping per-table — hence the factory.
 */

/**
 * Matches when the row carries *any* of the selected values.
 *
 * Cells hold either a scalar (`state`) or an array (`categories`), so both are
 * normalised to an array and compared as strings: facet values come out of the
 * URL, where everything is a string. Generic on the row type — a const typed
 * `FilterFn<unknown>` is invariant and will not assign to a concrete table.
 */
export function someOfFilter<T>(
	row: Row<T>,
	columnId: string,
	filterValue: unknown
): boolean {
	const selected = filterValue as string[] | undefined;
	if (!selected?.length) return true;

	const value = row.getValue(columnId);
	const values = Array.isArray(value) ? value : [value];

	return values.some((v) => selected.includes(String(v)));
}

/**
 * Free-text search over whichever human-readable fields a table nominates.
 *
 * TanStack has no notion of a table-wide filter that lives outside a column, so
 * each table parks this on its identity column and the toolbar input writes
 * that column's filter value.
 */
export function makeSearchFilter<T>(
	haystack: (row: T) => (string | number | null | undefined)[]
): FilterFn<T> {
	return (row: Row<T>, _columnId, filterValue) => {
		const query = String(filterValue ?? '')
			.trim()
			.toLowerCase();
		if (!query) return true;

		return haystack(row.original)
			.filter((part) => part !== null && part !== undefined && part !== '')
			.join(' ')
			.toLowerCase()
			.includes(query);
	};
}

export function countBy<T extends string>(values: T[]): Record<string, number> {
	return values.reduce<Record<string, number>>((acc, value) => {
		acc[value] = (acc[value] ?? 0) + 1;
		return acc;
	}, {});
}

export interface FacetOption {
	label: string;
	value: string;
}

export interface BuildFacetOptionsArgs<V extends string> {
	/** One entry per row (or per row-value, for array-valued columns). */
	values: V[];
	/** Display order; also the completeness contract for the axis. */
	order: readonly V[];
	labelFor: (value: V) => string;
}

/**
 * Facet options carrying live counts, e.g. `Open (12)`.
 *
 * Values with a zero count are dropped rather than shown disabled: an option
 * that matches nothing in the current data is noise, and the whole control is
 * disabled when nothing is left.
 */
export function buildFacetOptions<V extends string>({
	values,
	order,
	labelFor
}: BuildFacetOptionsArgs<V>): FacetOption[] {
	const counts = countBy(values);

	return order
		.filter((value) => counts[value])
		.map((value) => ({
			value,
			label: `${labelFor(value)} (${counts[value]})`
		}));
}
