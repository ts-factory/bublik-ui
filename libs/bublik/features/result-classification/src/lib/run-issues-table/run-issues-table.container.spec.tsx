/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import type { ColumnDef } from '@tanstack/react-table';

import { TooltipProvider } from '@/shared/tailwind-ui';
import type { RunIssueRow } from '@/shared/types';

import { RunIssuesTable } from './run-issues-table.container';
import { COLUMN_ID } from './run-issues-table.constants';

const ISSUES: RunIssueRow[] = Array.from({ length: 25 }, (_, index) => ({
	issue_id: index + 1,
	title: `Issue ${index + 1}`,
	description: null,
	state: 'open',
	bug_key: null,
	bug_url: null,
	result_count: 100 - index,
	rules: []
}));

vi.mock('@/services/bublik-api', async (importOriginal) => ({
	...(await importOriginal<object>()),
	useGetRunIssuesQuery: () => ({
		data: ISSUES,
		isLoading: false,
		error: undefined
	})
}));

// The real cells pull in the issue modals, project links and badges; paging
// only needs the columns the table state names.
vi.mock('./run-issues-table.columns', () => ({
	getColumns: (): ColumnDef<RunIssueRow>[] => [
		{
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			cell: ({ getValue }) => <span>{getValue<string>()}</span>
		},
		{ id: COLUMN_ID.RESULTS, accessorFn: (row) => row.result_count },
		{ id: COLUMN_ID.STATE, accessorFn: (row) => row.state },
		{ id: COLUMN_ID.EFFECT, accessorFn: () => '' },
		{ id: COLUMN_ID.CATEGORIES, accessorFn: () => '' }
	]
}));

// The toolbar and footer reach for icons that do not resolve under vitest;
// any name gets a bare svg.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

vi.mock('../issue-results-table/issue-results-table.container', () => ({
	RunIssueResults: () => null
}));

// jsdom has no `scrollTo`; every page change scrolls the table back to the top.
Element.prototype.scrollTo ??= () => undefined;

function Search() {
	return <output data-testid="search">{useLocation().search}</output>;
}

/** Lets the table's queued work run — its page reset is one of those tasks. */
function settle() {
	return act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function setup(initialEntry: string) {
	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<QueryParamProvider
				adapter={ReactRouter6Adapter}
				options={{ updateType: 'replaceIn' }}
			>
				<TooltipProvider>
					<RunIssuesTable runId={1} projectId={1} />
				</TooltipProvider>
				<Search />
			</QueryParamProvider>
		</MemoryRouter>
	);
}

async function click(name: string) {
	fireEvent.click(screen.getByRole('button', { name }));
	await settle();
}

describe('RunIssuesTable', () => {
	it('keeps the page Next and Previous move to', async () => {
		setup('/runs/1/issues?pageSize=10');

		expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

		await click('Next page');
		await click('Next page');

		expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
		expect(screen.getByText('Issue 21')).toBeInTheDocument();
		expect(screen.getByTestId('search')).toHaveTextContent('page=3');

		await click('Previous page');

		expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
		expect(screen.getByTestId('search')).toHaveTextContent('page=2');
	});
});
