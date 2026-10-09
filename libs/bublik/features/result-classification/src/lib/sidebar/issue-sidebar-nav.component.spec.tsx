/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/router/testing';
import { SidebarProvider, TooltipProvider } from '@/shared/tailwind-ui';

import { IssueSidebarNav } from './issue-sidebar-nav.component';

const issue = vi.hoisted(() => ({
	id: 47,
	title: 'Path MTU handling stalls TCP',
	state: 'open',
	bug_key: 'ref://E2E_BUGS/E2E-146',
	// Resolves to a tracker page, which the entry must still not link to.
	bug_url: 'https://bugs.example.invalid/issue/E2E-146',
	rule_count: 1,
	result_count: 56
}));

vi.mock('@/services/bublik-api', async (importOriginal) => ({
	...(await importOriginal<object>()),
	useGetIssueQuery: () => ({ data: issue, isLoading: false })
}));

vi.mock('@/shared/tailwind-ui', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/shared/tailwind-ui')>();

	return { ...actual, Icon: () => <svg /> };
});

function renderNav(isSidebarOpen: boolean) {
	return renderWithRouter(
		<TooltipProvider>
			<SidebarProvider isSidebarOpen={isSidebarOpen}>
				<IssueSidebarNav />
			</SidebarProvider>
		</TooltipProvider>,
		{ path: '/issues/47' }
	);
}

describe('the Issue sidebar entry', () => {
	it('shows the active issue key, without a link out to its tracker', async () => {
		await renderNav(true);

		const key = screen.getByTestId('issue-sidebar-key');
		expect(key).toHaveTextContent('E2E-146');
		expect(key).not.toHaveClass('opacity-0');
		expect(screen.queryByTestId('issue-sidebar-bug-link')).toBeNull();
	});

	it('follows the Issue entry when the key is clicked', async () => {
		await renderNav(true);

		const link = screen.getByTestId('issue-sidebar-key').closest('a');
		expect(link).not.toBeNull();
		expect(link).toHaveAttribute('href', expect.stringMatching(/\/issues\/47/));
		expect(link).toHaveAccessibleName(/^Issue\b/);
	});

	it('fades the key out when the sidebar is collapsed', async () => {
		await renderNav(false);

		expect(screen.getByTestId('issue-sidebar-key')).toHaveClass('opacity-0');
	});
});
