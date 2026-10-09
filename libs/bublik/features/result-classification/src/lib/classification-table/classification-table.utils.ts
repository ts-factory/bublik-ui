/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import type { FilterFn, Row, Table } from '@tanstack/react-table';

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
	/** `<label> (<count>)`: what the filter searches, and shows by default. */
	label: string;
	value: string;
	count: number;
	/** More words the search matches — the long form of a short label. */
	keywords?: string[];
	/** Shown instead of `label`; see `withFacetBadges`. */
	render?: ReactNode;
	/** At the end of the row in the filter's list; see `withFacetBadges`. */
	detail?: ReactNode;
}

export interface BuildFacetOptionsArgs<V extends string> {
	values: V[];
	order: readonly V[];
	labelFor: (value: V) => string;
	keywordsFor?: (value: V) => string[];
}

/** Options counted over the rows the table holds — the current page. */
export function buildFacetOptions<V extends string>({
	values,
	order,
	labelFor,
	keywordsFor
}: BuildFacetOptionsArgs<V>): FacetOption[] {
	return countedFacetOptions({
		counts: countBy(values),
		order,
		labelFor,
		keywordsFor
	});
}

export interface CountedFacetOptionsArgs<V extends string> {
	/** Value → count, e.g. one dimension of a `/facets/` response. */
	counts: Partial<Record<string, number>>;
	order: readonly V[];
	labelFor: (value: V) => string;
	keywordsFor?: (value: V) => string[];
}

/**
 * Options from counts the caller already has — typically the server's facet
 * counts over the whole filtered set. A value with no rows is left out.
 */
export function countedFacetOptions<V extends string>({
	counts,
	order,
	labelFor,
	keywordsFor
}: CountedFacetOptionsArgs<V>): FacetOption[] {
	return order
		.filter((value) => counts[value])
		.map((value) => ({
			value,
			label: `${labelFor(value)} (${counts[value]})`,
			count: counts[value] ?? 0,
			keywords: keywordsFor?.(value)
		}));
}

export function openFacetOptions(
	values: string[],
	labelFor: (value: string) => string = (value) => value
): FacetOption[] {
	return countedOpenFacetOptions(countBy(values), labelFor);
}

/**
 * Options for a dimension with no fixed vocabulary — tags, verdicts,
 * parameters — from counts keyed by value, ordered by label.
 */
export function countedOpenFacetOptions(
	counts: Partial<Record<string, number>>,
	labelFor: (value: string) => string = (value) => value
): FacetOption[] {
	const order = Object.keys(counts).sort((a, b) =>
		labelFor(a).localeCompare(labelFor(b))
	);

	return countedFacetOptions({ counts, order, labelFor });
}

export interface ColumnOrderPins {
	/** Ids held at the front, in this order, whatever the reader dragged. */
	first?: readonly string[];
	/** Ids held at the back, in this order. */
	last?: readonly string[];
}

/**
 * A saved column order, brought back in line with the columns the table has
 * today.
 *
 * Ids the table no longer knows are dropped. Pinned ids are then forced to
 * their end regardless of where a stale save put them: the stripe stays first
 * and Actions stays last. Ids the table gained since the order was saved are
 * slotted in after their default predecessor — the nearest earlier default
 * column the reader kept — so a new column follows a familiar neighbour
 * rather than landing at the far end.
 */
export function reconcileColumnOrder(
	saved: readonly string[] | undefined,
	defaultOrder: readonly string[],
	pins: ColumnOrderPins = {}
): string[] {
	const known = new Set(defaultOrder);
	const first = (pins.first ?? []).filter((id) => known.has(id));
	const last = (pins.last ?? []).filter((id) => known.has(id));
	const pinned = new Set([...first, ...last]);

	const middle = (saved ?? []).filter(
		(id, index, all) =>
			known.has(id) && !pinned.has(id) && all.indexOf(id) === index
	);
	const middleDefault = defaultOrder.filter((id) => !pinned.has(id));

	middleDefault.forEach((id, index) => {
		if (middle.includes(id)) return;

		const before = middleDefault
			.slice(0, index)
			.reverse()
			.find((candidate) => middle.includes(candidate));
		const at = before === undefined ? 0 : middle.indexOf(before) + 1;

		middle.splice(at, 0, id);
	});

	return [...first, ...middle, ...last];
}

/**
 * The id the table gives the grouped row for `value` of `columnId` — the key
 * to use in the `expanded` map to open or fold that group. Top-level groups
 * only; a nested grouping would prefix the parent's id.
 */
export function groupRowId(columnId: string, value: unknown): string {
	return `${columnId}:${String(value)}`;
}

export function facetControls<T>(table: Table<T>) {
	const values = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const set = (columnId: string, next: string[] | undefined) =>
		table.getColumn(columnId)?.setFilterValue(next?.length ? next : undefined);

	const toggle = (columnId: string, value: string) => {
		const current = values(columnId);

		set(
			columnId,
			current.includes(value)
				? current.filter((entry) => entry !== value)
				: [...current, value]
		);
	};

	const toggleProps = (columnId: string, value: string) => ({
		isSelected: values(columnId).includes(value),
		onClick: () => toggle(columnId, value)
	});

	return { values, set, toggle, toggleProps };
}

export type FacetControls = ReturnType<typeof facetControls>;
