/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function mockFeatures(
	data: ReturnType<typeof useGetServerFeaturesQuery>['data']
): void {
	vi.mocked(useGetServerFeaturesQuery).mockReturnValue({
		data
	} as unknown as ReturnType<typeof useGetServerFeaturesQuery>);
}

let navigateTo: (to: string) => void = () => undefined;

function NavigationProbe() {
	const navigate = useNavigate();
	const location = useLocation();

	// Carry the sidebar state along, as the app's own links do.
	navigateTo = (to) => navigate(`${to}${location.search}`);

	return <output data-testid="pathname">{location.pathname}</output>;
}

function renderAt(path: string) {
	const ui = (
		<MemoryRouter initialEntries={[path]}>
			<ChatSidebarNav />
			<NavigationProbe />
		</MemoryRouter>
	);

	return { ...render(ui), ui };
}

function getChatHref(): string | null | undefined {
	return screen.getByText('Chat').closest('a')?.getAttribute('href');
}

describe('ChatSidebarNav', () => {
	beforeEach(() => {
		mockFeatures({ analytics_enabled: false, chat_enabled: true });
	});

	it('shows Chat when chat is enabled', () => {
		renderAt('/runs');

		expect(getChatHref()).toBe('/chat');
	});

	it('links back to the last open thread after leaving the chat', () => {
		renderAt('/chat/thread-1');

		act(() => navigateTo('/runs'));

		expect(screen.getByTestId('pathname').textContent).toBe('/runs');
		expect(getChatHref()).toBe('/chat/thread-1');
	});

	it('follows the thread switched to most recently', () => {
		renderAt('/chat/thread-1');

		act(() => navigateTo('/chat/thread-2'));
		act(() => navigateTo('/runs'));

		expect(getChatHref()).toBe('/chat/thread-2');
	});

	it('hides Chat while features are loading or chat is disabled', () => {
		mockFeatures(undefined);

		const { rerender, ui } = renderAt('/runs');

		expect(screen.queryByText('Chat')).toBeNull();

		mockFeatures({ analytics_enabled: false, chat_enabled: false });

		rerender(ui);

		expect(screen.queryByText('Chat')).toBeNull();
	});
});
