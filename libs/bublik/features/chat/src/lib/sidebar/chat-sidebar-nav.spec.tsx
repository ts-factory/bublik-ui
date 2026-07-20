/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { ChatSidebarNav } from './chat-sidebar-nav';

vi.mock('@/services/bublik-api', () => ({
	useGetServerFeaturesQuery: vi.fn()
}));

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: ({ to, children }: { to: string; children: ReactNode }) => (
		<a href={to}>{children}</a>
	)
}));

vi.mock('@/bublik/features/sidebar-nav', () => {
	const SidebarNavInternalLink = Object.assign(
		({ to, children }: { to: string; children: ReactNode }) => (
			<a href={to}>{children}</a>
		),
		{
			Icon: () => null,
			Label: ({ children }: { children: ReactNode }) => <span>{children}</span>
		}
	);

	return {
		SidebarNavInternalLink,
		SidebarNavItem: ({ children }: { children: ReactNode }) => (
			<nav>{children}</nav>
		),
		SidebarNavLinkWrapper: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		)
	};
});

describe('ChatSidebarNav', () => {
	it('shows Chat when chat is enabled', () => {
		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: { analytics_enabled: false, chat_enabled: true }
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		render(<ChatSidebarNav />);

		expect(screen.getByText('Chat').closest('a')?.getAttribute('href')).toBe(
			'/chat'
		);
	});

	it('hides Chat while features are loading or chat is disabled', () => {
		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: undefined
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		const { rerender } = render(<ChatSidebarNav />);

		expect(screen.queryByText('Chat')).toBeNull();

		vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
			data: { analytics_enabled: false, chat_enabled: false }
		} as ReturnType<typeof useGetServerFeaturesQuery>);

		rerender(<ChatSidebarNav />);

		expect(screen.queryByText('Chat')).toBeNull();
	});
});
