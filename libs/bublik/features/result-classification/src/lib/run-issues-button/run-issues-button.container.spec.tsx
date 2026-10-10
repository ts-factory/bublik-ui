/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { forwardRef, ReactNode } from 'react';

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

function setup() {
	render(
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

	it('shows a loading button while the issues load', () => {
		const button = setup();

		expect(button.tagName).toBe('BUTTON');
		expect(button).toHaveTextContent('Issues');
	});

	it('is disabled when the run has no issues', () => {
		issuesQuery.current = { data: [] };

		expect(setup()).toBeDisabled();
	});

	it('is disabled when the issues fail to load', () => {
		issuesQuery.current = { error: { status: 500 } };

		expect(setup()).toBeDisabled();
	});

	it('links to the run issues page when the run has issues', () => {
		issuesQuery.current = { data: [ISSUE] };

		expect(setup()).toHaveAttribute('href', '/runs/42/issues');
	});
});
