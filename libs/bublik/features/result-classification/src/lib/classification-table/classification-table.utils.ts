/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
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
	label: string;
	value: string;
}

export interface BuildFacetOptionsArgs<V extends string> {
	values: V[];
	order: readonly V[];
	labelFor: (value: V) => string;
}

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

export function openFacetOptions(values: string[]): FacetOption[] {
	const unique = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

	return buildFacetOptions({
		values,
		order: unique,
		labelFor: (value) => value
	});
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
