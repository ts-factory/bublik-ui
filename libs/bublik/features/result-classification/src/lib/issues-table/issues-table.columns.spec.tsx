/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactNode, forwardRef } from 'react';
import {
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { Issue, IssueState } from '@/shared/types';

import { COLUMN_ID } from './issues-table.constants';
import type { IssueTableRow } from './issues-table.types';
import { buildRows } from './issues-table.utils';

vi.mock('@/bublik/features/projects', () => {
	interface MockLinkProps {
		to: string | { pathname?: string };
		children: ReactNode;
	}

	return {
		LinkWithProject: forwardRef<
			HTMLAnchorElement,
			MockLinkProps & Record<string, unknown>
		>(({ to, children, ...props }, ref) => (
			<a ref={ref} href={typeof to === 'string' ? to : to.pathname} {...props}>
				{children}
			</a>
		))
	};
});

// The Actions column's buttons open the issue modals; the Key column has no
// use for them.
vi.mock('../issue-form/issue-drawer.container', () => ({
	EditIssueButton: () => null,
	IssueDeleteButton: () => null
}));

const { getColumns } = await import('./issues-table.columns');

function issueRow(id: number, state: IssueState): IssueTableRow {
	const issue: Issue = {
		id,
		project: 1,
		title: `Issue ${id}`,
		description: null,
		state,
		bug_key: `ref://JIRA/E2E-${id}`,
		bug_url: null,
		project_name: 'project',
		rules: [],
		rule_count: 0,
		active_rule_count: 0,
		result_count: 0,
		rules_state: 'unruled',
		created_at: '2026-01-01T00:00:00Z',
		created_by_name: null,
		updated_at: '2026-01-01T00:00:00Z',
		updated_by_name: null,
		closed_at: state === 'closed' ? '2026-01-02T00:00:00Z' : null,
		closed_by_name: null
	};

	return buildRows([issue], new Map())[0];
}

/** Renders only the Key column's cells, one per row. */
function KeyColumn({ data }: { data: IssueTableRow[] }) {
	const table = useReactTable({
		data,
		columns: getColumns().filter((column) => column.id === COLUMN_ID.KEY),
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<TooltipProvider delayDuration={0}>
			{table
				.getRowModel()
				.rows.map((tableRow) =>
					tableRow
						.getVisibleCells()
						.map((cell) => (
							<div key={cell.id}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</div>
						))
				)}
		</TooltipProvider>
	);
}

describe('issues table — Key column', () => {
	it('strikes the key of a closed issue', () => {
		render(<KeyColumn data={[issueRow(140, 'closed')]} />);

		const key = screen.getByText('E2E-140');
		expect(key).toHaveClass('line-through');
		expect(key).toHaveAttribute('data-issue-state', 'closed');
	});

	it('leaves the key of an open issue unstruck', () => {
		render(<KeyColumn data={[issueRow(123, 'open')]} />);

		const key = screen.getByText('E2E-123');
		expect(key).not.toHaveClass('line-through');
		expect(key).not.toHaveAttribute('data-issue-state');
	});
});
