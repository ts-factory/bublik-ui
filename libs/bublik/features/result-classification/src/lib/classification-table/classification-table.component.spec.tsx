/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
	getCoreRowModel,
	useReactTable,
	type ColumnDef
} from '@tanstack/react-table';

import { ClassificationTable } from './classification-table.component';

interface Row {
	id: number;
	name: string;
	state: string;
}

const DATA: Row[] = [
	{ id: 1, name: 'first', state: 'open' },
	{ id: 2, name: 'second', state: 'closed' }
];

// Sorting off: the sort caret pulls in an icon that does not resolve under
// vitest, and this spec is about track and cell counts.
const COLUMNS: ColumnDef<Row, unknown>[] = [
	{
		id: 'name',
		header: 'Name',
		accessorFn: (row) => row.name,
		enableSorting: false
	},
	{
		id: 'state',
		header: 'State',
		accessorFn: (row) => row.state,
		enableSorting: false,
		meta: { width: 'auto' }
	}
];

function Harness({ endGutter }: { endGutter?: boolean }) {
	const table = useReactTable({
		data: DATA,
		columns: COLUMNS,
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel()
	});

	return <ClassificationTable table={table} endGutter={endGutter} />;
}

function grid(container: HTMLElement) {
	return container.querySelector('[role="table"]') as HTMLElement;
}

/**
 * Rows are `display: contents`, so cells are direct children of the one grid and
 * auto-placement runs straight through them. A track without a cell of its own
 * does not stay empty: it takes the next row's first cell and every row after it
 * lands a column to the left. Cells per row must equal tracks.
 */
function cellsPerRow(container: HTMLElement) {
	return [...grid(container).querySelectorAll('[role="row"]')].map(
		(row) => row.children.length
	);
}

describe('ClassificationTable', () => {
	it('gives each column one track', () => {
		const { container } = render(<Harness />);

		// 'auto' is one track, but 'minmax(0, 1fr)' splits on the space too.
		expect(grid(container).style.gridTemplateColumns).toBe(
			'minmax(0, 1fr) auto'
		);
		expect(cellsPerRow(container)).toEqual([2, 2, 2]);
	});

	it('adds a gutter track and a cell to sit in it', () => {
		const { container } = render(<Harness endGutter />);

		expect(grid(container).style.gridTemplateColumns).toBe(
			'minmax(0, 1fr) auto minmax(0, 1fr)'
		);
		expect(cellsPerRow(container)).toEqual([3, 3, 3]);
	});

	it('keeps every body row as wide as the header row', () => {
		for (const endGutter of [false, true]) {
			const { container } = render(<Harness endGutter={endGutter} />);
			const [header, ...body] = cellsPerRow(container);

			expect(body.length).toBe(DATA.length);
			for (const row of body) expect(row).toBe(header);
		}
	});
});
