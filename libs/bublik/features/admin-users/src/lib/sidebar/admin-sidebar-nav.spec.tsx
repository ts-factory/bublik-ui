/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/bublik/features/auth';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { AdminSidebarNav } from './admin-sidebar-nav';

vi.mock('@/bublik/features/auth', () => ({
	useAuth: vi.fn()
}));

vi.mock('@/services/bublik-api', () => ({
	useGetServerFeaturesQuery: vi.fn()
}));

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: ({ to, children }: { to: string; children: ReactNode }) => (
		<a href={to}>{children}</a>
	)
}));

vi.mock('@/bublik/features/sidebar-nav', () => {
	const SidebarNavCollapsibleContainer = Object.assign(
		({ children }: { children: ReactNode }) => <nav>{children}</nav>,
		{
			Item: ({ children }: { children: ReactNode }) => <div>{children}</div>,
			Submenu: ({ children }: { children: ReactNode }) => <div>{children}</div>
		}
	);

	const SidebarNavInternalLink = Object.assign(
		({ to, children }: { to: string; children: ReactNode }) => (
			<a href={to}>{children}</a>
		),
		{
			Icon: () => null,
			Label: ({ children }: { children: ReactNode }) => <span>{children}</span>
		}
	);

	const SidebarNavSubmenuItemContainer = Object.assign(
		({ to, children }: { to: string; children: ReactNode }) => (
			<a href={to}>{children}</a>
		),
		{
			Icon: () => null,
			Label: ({ children }: { children: ReactNode }) => <span>{children}</span>
		}
	);

	return {
		SidebarNavCollapsibleContainer,
		SidebarNavInternalLink,
		SidebarNavLinkWrapper: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		SidebarNavSubmenuItemContainer,
		SidebarNavToggle: () => null
	};
});

describe('AdminSidebarNav', () => {
	it('shows Analytics for admins when analytics are enabled', () => {
		vi.mocked(useAuth).mockReturnValue({ isAdmin: true } as ReturnType<
			typeof useAuth
		>);
		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: { analytics_enabled: true }
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		render(<AdminSidebarNav />);

		expect(
			screen.getByText('Analytics').closest('a')?.getAttribute('href')
		).toBe('/admin/analytics');
	});

	it('hides Analytics for non-admins or disabled analytics', () => {
		vi.mocked(useAuth).mockReturnValue({ isAdmin: false } as ReturnType<
			typeof useAuth
		>);
		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: { analytics_enabled: true }
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		const { rerender } = render(<AdminSidebarNav />);

		expect(screen.queryByText('Analytics')).toBeNull();

		vi.mocked(useAuth).mockReturnValue({ isAdmin: true } as ReturnType<
			typeof useAuth
		>);
		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: { analytics_enabled: false }
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		rerender(<AdminSidebarNav />);

		expect(screen.queryByText('Analytics')).toBeNull();
	});
});
