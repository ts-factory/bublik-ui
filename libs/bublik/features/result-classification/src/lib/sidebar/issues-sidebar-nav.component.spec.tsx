/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter, type TestRouter } from '@/router/testing';
import {
	getSidebarStateString,
	ISSUE_SIDEBAR_KEYS,
	ISSUES_SIDEBAR_KEYS
} from '@/bublik/features/sidebar';
import { SidebarProvider, TooltipProvider } from '@/shared/tailwind-ui';

import { IssueSidebarNav } from './issue-sidebar-nav.component';
import { IssuesSidebarNav } from './issues-sidebar-nav.component';

// The items count the open issues, the rules and an issue's results; no
// request leaves the spec.
vi.mock('@/services/bublik-api', async (importOriginal) => ({
	...(await importOriginal<object>()),
	useGetIssuesQuery: () => ({ data: undefined, isLoading: false }),
	useGetIssueRulesQuery: () => ({ data: undefined, isLoading: false }),
	useGetIssueQuery: () => ({ data: undefined, isLoading: false })
}));

vi.mock('@/shared/tailwind-ui', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/shared/tailwind-ui')>();

	return { ...actual, Icon: () => <svg /> };
});

/** Both sidebar items, on the page at `path?search`. */
function renderNav(path: string, search = '') {
	return renderWithRouter(
		<TooltipProvider>
			<SidebarProvider isSidebarOpen>
				<IssuesSidebarNav />
				<IssueSidebarNav />
			</SidebarProvider>
		</TooltipProvider>,
		{ path, search }
	);
}

function remembered(router: TestRouter, key: string) {
	return getSidebarStateString(
		new URLSearchParams(router.history.location.search),
		key
	);
}

describe('the issues and issue sidebar items', () => {
	it('remember an issue page, its query included, by a replace', async () => {
		const { router } = await renderNav('/issues/12', 'pageSize=50');

		await waitFor(() =>
			expect(remembered(router, ISSUE_SIDEBAR_KEYS.LAST_ISSUE)).toBe(
				'/issues/12?pageSize=50'
			)
		);
		expect(router.history.location.pathname).toBe('/v2/issues/12');
		expect(
			new URLSearchParams(router.history.location.search).get('pageSize')
		).toBe('50');
		expect(router.history.length).toBe(1);
	});

	it('take only a numeric id for an issue: the rules page is not one', async () => {
		const { router } = await renderNav('/issues/rules', 'q=timeout');

		await waitFor(() =>
			expect(remembered(router, ISSUES_SIDEBAR_KEYS.LAST_MODE)).toBe('rules')
		);
		expect(remembered(router, ISSUES_SIDEBAR_KEYS.LAST_RULES)).toBe(
			'/issues/rules?q=timeout'
		);
		expect(remembered(router, ISSUE_SIDEBAR_KEYS.LAST_ISSUE)).toBeNull();
	});

	it('remember the issues list as the last list', async () => {
		const { router } = await renderNav('/issues', 'state=open');

		await waitFor(() =>
			expect(remembered(router, ISSUES_SIDEBAR_KEYS.LAST_LIST)).toBe(
				'/issues?state=open'
			)
		);
		expect(remembered(router, ISSUES_SIDEBAR_KEYS.LAST_RULES)).toBeNull();
		expect(remembered(router, ISSUE_SIDEBAR_KEYS.LAST_ISSUE)).toBeNull();
	});

	it('remember nothing on a page outside the issues', async () => {
		const { router } = await renderNav('/runs', 'page=2');

		// Give the effects a chance to write.
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(router.history.location.search).toBe('?page=2');
	});
});
