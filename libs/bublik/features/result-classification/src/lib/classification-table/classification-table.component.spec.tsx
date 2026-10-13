/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	useReactTable,
	type ColumnDef
} from '@tanstack/react-table';

import { TooltipProvider } from '@/shared/tailwind-ui';

import {
	ClassificationRange,
	ClassificationTable,
	columnPickerItems
} from './classification-table.component';
import { useGroupedExpanded } from './classification-table.hooks';
import { groupRowId } from './classification-table.utils';

// The sort caret and the group toggle both reach for icons that do not
// resolve under vitest; the two this table renders are enough.
vi.mock('@/icons', () => ({
	ArrowShortTop: (props: Record<string, unknown>) => (
		<svg data-icon="ArrowShortTop" {...props} />
	),
	SortArrow: (props: Record<string, unknown>) => (
		<svg data-icon="SortArrow" {...props} />
	)
}));

interface Row {
	id: number;
	name: string;
	state: string;
	project: number;
}

const DATA: Row[] = [
	{ id: 1, name: 'first', state: 'open', project: 7 },
	{ id: 2, name: 'second', state: 'closed', project: 9 },
	{ id: 3, name: 'third', state: 'open', project: 7 }
];

// Sorting off: this spec is about track and cell counts.
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

const PROJECT_COLUMN: ColumnDef<Row, unknown> = {
	id: 'project',
	header: 'Project',
	accessorFn: (row) => row.project,
	enableSorting: false,
	enableHiding: false,
	enableGrouping: true
};

function Harness({
	endGutter,
	gutterBefore
}: {
	endGutter?: boolean;
	gutterBefore?: readonly string[];
}) {
	const table = useReactTable({
		data: DATA.slice(0, 2),
		columns: COLUMNS,
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<ClassificationTable
			table={table}
			endGutter={endGutter}
			gutterBefore={gutterBefore}
		/>
	);
}

function GroupedHarness({ endGutter }: { endGutter?: boolean }) {
	const [expanded, setExpanded] = useGroupedExpanded(
		'project',
		DATA.map((row) => row.project)
	);
	const table = useReactTable({
		data: DATA,
		columns: [...COLUMNS, PROJECT_COLUMN],
		state: {
			grouping: ['project'],
			columnVisibility: { project: false },
			expanded
		},
		onExpandedChange: setExpanded,
		autoResetExpanded: false,
		getRowId: (row) => String(row.id),
		getRowCanExpand: (row) => row.getIsGrouped(),
		getCoreRowModel: getCoreRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	return (
		<TooltipProvider>
			<ClassificationTable
				table={table}
				endGutter={endGutter}
				renderGroupHeader={(row) => (
					<span data-testid="group-label" data-row-key={row.id}>
						Project {String(row.groupingValue)} · {row.subRows.length}
					</span>
				)}
				getRowAttributes={(row) => ({ 'data-row-id': row.original.id })}
			/>
		</TooltipProvider>
	);
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
	return [...grid(container).querySelectorAll('[role="row"]')]
		.filter((row) => !row.hasAttribute('data-group-key'))
		.map((row) => row.children.length);
}

/** The position of the gutter cell in each row, header first. */
function gutterPositions(container: HTMLElement) {
	return [...grid(container).querySelectorAll('[role="row"]')]
		.filter((row) => !row.hasAttribute('data-group-key'))
		.map((row) =>
			[...row.children].findIndex((cell) => cell.hasAttribute('aria-hidden'))
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
		expect(gutterPositions(container)).toEqual([2, 2, 2]);
	});

	it('puts the gutter before the columns pinned to the right edge', () => {
		const { container } = render(
			<Harness endGutter gutterBefore={['state']} />
		);

		expect(grid(container).style.gridTemplateColumns).toBe(
			'minmax(0, 1fr) minmax(0, 1fr) auto'
		);
		expect(cellsPerRow(container)).toEqual([3, 3, 3]);
		expect(gutterPositions(container)).toEqual([1, 1, 1]);
	});

	it('falls back to the end when no pinned column is visible', () => {
		const { container } = render(
			<Harness endGutter gutterBefore={['missing']} />
		);

		expect(grid(container).style.gridTemplateColumns).toBe(
			'minmax(0, 1fr) auto minmax(0, 1fr)'
		);
		expect(gutterPositions(container)).toEqual([2, 2, 2]);
	});

	it('keeps every body row as wide as the header row', () => {
		for (const endGutter of [false, true]) {
			const { container } = render(<Harness endGutter={endGutter} />);
			const [header, ...body] = cellsPerRow(container);

			expect(body.length).toBe(2);
			for (const row of body) expect(row).toBe(header);
		}
	});

	describe('grouped rows', () => {
		it('puts one heading before each group, with its rows under it', () => {
			const { container } = render(<GroupedHarness />);

			const labels = screen.getAllByTestId('group-label');
			expect(labels.map((el) => el.textContent)).toEqual([
				'Project 7 · 2',
				'Project 9 · 1'
			]);
			// The ids `useGroupedExpanded` seeds are the ones the table hands out.
			expect(labels.map((el) => el.getAttribute('data-row-key'))).toEqual([
				groupRowId('project', 7),
				groupRowId('project', 9)
			]);

			// Order in the grid: heading 7, rows 1 and 3, heading 9, row 2.
			const sequence = [...grid(container).querySelectorAll('[role="row"]')]
				.slice(1)
				.map(
					(row) =>
						row.getAttribute('data-group-key') ??
						`row ${row.getAttribute('data-row-id')}`
				);
			expect(sequence).toEqual(['7', 'row 1', 'row 3', '9', 'row 2']);
		});

		it('spans the heading across every track, gutter included', () => {
			const { container } = render(<GroupedHarness endGutter />);
			const [heading] = container.querySelectorAll('[data-group-key]');

			expect((heading as HTMLElement).style.gridColumn).toBe('1 / -1');
			// The grouping column is hidden, so the tracks are the two visible
			// columns plus the gutter, and every ordinary row still fills them.
			expect(grid(container).style.gridTemplateColumns).toBe(
				'minmax(0, 1fr) auto minmax(0, 1fr)'
			);
			expect(cellsPerRow(container)).toEqual([3, 3, 3, 3]);
		});

		it('folds a group away and brings it back', () => {
			const { container } = render(<GroupedHarness />);
			const rowsOf = (key: string) =>
				[...grid(container).querySelectorAll('[data-row-id]')].filter((row) => {
					const id = Number(row.getAttribute('data-row-id'));
					return DATA.find((d) => d.id === id)?.project === Number(key);
				}).length;

			expect(rowsOf('7')).toBe(2);

			const [toggle] = screen.getAllByTestId('classification-group-toggle');
			fireEvent.click(toggle);

			expect(rowsOf('7')).toBe(0);
			expect(rowsOf('9')).toBe(1);
			expect(
				container
					.querySelector('[data-group-key="7"]')
					?.getAttribute('data-expanded')
			).toBe('false');

			fireEvent.click(screen.getAllByTestId('classification-group-toggle')[0]);

			expect(rowsOf('7')).toBe(2);
		});
	});
});

describe('columnPickerItems', () => {
	function PickerHarness({ order }: { order: string[] }) {
		const table = useReactTable({
			data: DATA,
			columns: [...COLUMNS, PROJECT_COLUMN],
			state: { columnOrder: order, columnVisibility: { state: false } },
			getRowId: (row) => String(row.id),
			getCoreRowModel: getCoreRowModel()
		});

		return (
			<ul>
				{columnPickerItems(table, order).map((item) => (
					<li key={item.id} data-checked={item.checked}>
						{item.label}
					</li>
				))}
			</ul>
		);
	}

	it('lists the hideable columns in the order given, with their state', () => {
		render(<PickerHarness order={['state', 'name', 'project']} />);

		const items = screen.getAllByRole('listitem');
		expect(items.map((li) => li.textContent)).toEqual(['State', 'Name']);
		expect(items.map((li) => li.getAttribute('data-checked'))).toEqual([
			'false',
			'true'
		]);
	});

	it('skips a column the order names but the table lacks, without an error', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {
			// Asserted on below.
		});

		render(<PickerHarness order={['expander', 'state', 'name']} />);

		expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
			['State', 'Name']
		);
		expect(error).not.toHaveBeenCalled();
		error.mockRestore();
	});
});

describe('ClassificationRange', () => {
	it('ends the range at the page end when more rows match than one page holds', () => {
		render(
			<ClassificationRange
				matchedCount={30}
				pageIndex={0}
				pageSize={25}
				noun="issue"
			/>
		);

		expect(screen.getByText('1–25 of 30 issues')).toBeTruthy();
	});

	it('ends the last page at the total, counting every page before it', () => {
		render(
			<ClassificationRange
				matchedCount={145}
				pageIndex={1}
				pageSize={100}
				noun="issue"
			/>
		);

		expect(screen.getByText('101–145 of 145 issues')).toBeTruthy();
	});

	it('names the matching rows and the total when filters narrow them', () => {
		render(
			<ClassificationRange
				matchedCount={12}
				totalCount={30}
				pageIndex={1}
				pageSize={10}
				noun="issue"
			/>
		);

		expect(screen.getByText('11–12 of 12 matching · 30 total')).toBeTruthy();
	});
});
