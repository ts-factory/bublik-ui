/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen, waitFor } from '@testing-library/react';
import { type ComponentType, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
	DASHBOARD_SIDEBAR_KEYS,
	getSidebarStateString,
	setSidebarStateValue,
	updateSidebarStateSearchParams
} from '@/bublik/features/sidebar';
import { renderWithRouter } from '@/router/testing';

import { DashboardSidebarNav } from './dashboard-sidebar-nav';

vi.mock('@/bublik/features/sidebar-nav', () => {
	const SidebarNavInternalLink = Object.assign(
		({
			to,
			linkComponent: LinkComponent,
			children
		}: {
			to: string;
			linkComponent: ComponentType<{ to: string; children: ReactNode }>;
			children: ReactNode;
		}) => <LinkComponent to={to}>{children}</LinkComponent>,
		{
			Icon: () => null,
			Label: ({ children }: { children: ReactNode }) => <span>{children}</span>
		}
	);

	return {
		SidebarNavItem: ({ children }: { children: ReactNode }) => (
			<nav>{children}</nav>
		),
		SidebarNavLinkWrapper: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		SidebarNavInternalLink
	};
});

function lastDashboardUrl(search: string): string | null {
	return getSidebarStateString(
		new URLSearchParams(search),
		DASHBOARD_SIDEBAR_KEYS.LAST_URL
	);
}

describe('DashboardSidebarNav', () => {
	// The projects and the sidebar keys are not part of the remembered view.
	it('remembers the dashboard view on screen in the sidebar state, in place', async () => {
		const { router } = await renderWithRouter(<DashboardSidebarNav />, {
			path: '/dashboard',
			search: '?main=2026-04-20&mode=rows&project=3'
		});
		const { length } = router.history;

		await waitFor(() =>
			expect(lastDashboardUrl(router.history.location.search)).toBe(
				'/dashboard?main=2026-04-20&mode=rows'
			)
		);
		expect(router.history.location.search).toMatch(
			/^\?main=2026-04-20&mode=rows&project=3&_s=/
		);
		expect(router.history.length).toBe(length);
	});

	it('writes nothing off the dashboard', async () => {
		const { router } = await renderWithRouter(<DashboardSidebarNav />, {
			path: '/runs',
			search: '?page=2'
		});

		expect(router.history.location.search).toBe('?page=2');
	});

	it('links to the remembered dashboard view, or to the plain dashboard', async () => {
		const sidebar = updateSidebarStateSearchParams(
			new URLSearchParams(),
			(state) =>
				setSidebarStateValue(
					state,
					DASHBOARD_SIDEBAR_KEYS.LAST_URL,
					'/dashboard?main=2026-04-20&mode=columns'
				)
		);

		await renderWithRouter(<DashboardSidebarNav />, {
			path: '/runs',
			search: `?${sidebar?.toString()}`
		});

		expect(
			screen.getByText('Dashboard').closest('a')?.getAttribute('href')
		).toBe(`/v2/dashboard?main=2026-04-20&mode=columns&${sidebar?.toString()}`);
	});

	it('links to the plain dashboard without a remembered view', async () => {
		await renderWithRouter(<DashboardSidebarNav />, { path: '/runs' });

		expect(
			screen.getByText('Dashboard').closest('a')?.getAttribute('href')
		).toBe('/v2/dashboard');
	});
});
