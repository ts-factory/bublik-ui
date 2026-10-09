/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithRouter } from '@/router/testing';
import { TooltipProvider } from '@/shared/tailwind-ui';
import type { RunIssueRow } from '@/shared/types';

const issuesQuery = vi.hoisted(() => ({
	current: {} as { data?: RunIssueRow[]; error?: unknown }
}));

vi.mock('@/services/bublik-api', async (importOriginal) => ({
	...(await importOriginal<object>()),
	useGetRunDetailsQuery: () => ({ data: { project_id: 1 } }),
	useGetRunIssuesQuery: () => issuesQuery.current
}));

// The icons do not resolve under vitest; any name gets a bare svg.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

const { RunIssuesButton } = await import('./run-issues-button.container');

const ISSUE: RunIssueRow = {
	issue_id: 1,
	title: 'Issue 1',
	description: null,
	state: 'open',
	bug_key: null,
	bug_url: null,
	result_count: 1,
	rules: []
};

async function setup() {
	await renderWithRouter(
		<TooltipProvider>
			<RunIssuesButton runId={42} />
		</TooltipProvider>
	);

	return screen.getByTestId('run-issues-button');
}

describe('RunIssuesButton', () => {
	beforeEach(() => {
		issuesQuery.current = {};
	});

	it('shows a loading button while the issues load', async () => {
		const button = await setup();

		expect(button.tagName).toBe('BUTTON');
		expect(button).toHaveTextContent('Issues');
	});

	it('is disabled when the run has no issues', async () => {
		issuesQuery.current = { data: [] };

		expect(await setup()).toBeDisabled();
	});

	it('is disabled when the issues fail to load', async () => {
		issuesQuery.current = { error: { status: 500 } };

		expect(await setup()).toBeDisabled();
	});

	it('links to the run issues page when the run has issues', async () => {
		issuesQuery.current = { data: [ISSUE] };

		expect(await setup()).toHaveAttribute('href', '/v2/runs/42/issues');
	});
});
