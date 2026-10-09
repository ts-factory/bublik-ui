/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { type ReactNode } from 'react';
import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	getSidebarStateString
} from '@/bublik/features/sidebar';
import { renderWithRouter, type TestRouter } from '@/router/testing';

import { RunSidebarNav } from './run-sidebar-nav';

vi.mock('@/services/bublik-api', () => ({
	useGetRunReportConfigsQuery: () => ({ data: undefined, isLoading: false }),
	useGetRunDetailsQuery: () => ({ data: { project_id: 1 } }),
	useGetRunIssuesQuery: () => ({ data: [], isLoading: false })
}));

// Only the recording effect is under test: the nav items render their children.
vi.mock('@/bublik/features/sidebar-nav', () => {
	const Children = ({ children }: { children?: ReactNode }) => (
		<div>{children}</div>
	);
	const Nothing = () => null;

	return {
		SidebarNavLinkWrapper: Children,
		SidebarNavInternalLink: Object.assign(Children, {
			Icon: Nothing,
			Label: Children
		}),
		SidebarNavToggle: Nothing,
		SidebarNavCollapsibleContainer: Object.assign(Children, {
			Item: Children,
			Submenu: Children
		}),
		SidebarNavInfoButton: Nothing,
		SidebarNavSubmenuItemContainer: Object.assign(Children, {
			Icon: Nothing,
			Label: Children,
			InfoButton: Nothing,
			ModeSwitch: Nothing
		})
	};
});

// The run key and issue count badges read the sidebar's open state.
vi.mock('@/bublik/features/result-classification', async (importOriginal) => ({
	...(await importOriginal<object>()),
	OpenIssueCountBadge: () => null,
	SidebarKeyBadge: () => null
}));

function sidebarValue(router: TestRouter, key: string) {
	return getSidebarStateString(
		new URLSearchParams(router.history.location.search),
		key
	);
}

beforeEach(() => {
	// The router scrolls the window once on load; jsdom has no `scrollTo`.
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('RunSidebarNav', () => {
	it('remembers the run details on screen, query string included', async () => {
		const { router } = await renderWithRouter(<RunSidebarNav />, {
			path: '/runs/42',
			search: '?expanded=abc&project=3'
		});

		await waitFor(() =>
			expect(sidebarValue(router, RUN_SIDEBAR_KEYS.LAST_DETAILS)).toBe(
				'/runs/42?expanded=abc'
			)
		);
		expect(sidebarValue(router, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID)).toBe('42');
		expect(router.history.location.search).toMatch(
			/^\?expanded=abc&project=3&_s=/
		);
		expect(router.history.length).toBe(1);
	});

	it('remembers the run issues on screen', async () => {
		const { router } = await renderWithRouter(<RunSidebarNav />, {
			path: '/runs/42/issues',
			search: '?page=2'
		});

		await waitFor(() =>
			expect(sidebarValue(router, RUN_SIDEBAR_KEYS.LAST_ISSUES)).toBe(
				'/runs/42/issues?page=2'
			)
		);
		expect(sidebarValue(router, RUN_SIDEBAR_KEYS.LAST_MODE)).toBe('issues');
	});

	it.each([
		['the report, which records itself', '/runs/42/report', '?config=1'],
		['a run id that is not a number', '/runs/abc', '?x=1'],
		['another page', '/runs', '?page=2']
	])('writes nothing on %s', async (_, path, search) => {
		const { router } = await renderWithRouter(<RunSidebarNav />, {
			path,
			search
		});

		// One render cycle for the effect to have run.
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(router.history.location.search).toBe(search);
	});
});
