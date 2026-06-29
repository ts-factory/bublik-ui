/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { HistorySidebarNav } from './history-sidebar-nav';
import { useHistorySidebarState } from './use-history-sidebar-state';

const mocks = vi.hoisted(() => ({
	location: {
		pathname: '/runs',
		search: ''
	}
}));

vi.mock('react-router-dom', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router-dom')>();

	return {
		...actual,
		useLocation: () => mocks.location
	};
});

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
		({
			to,
			disabled,
			children
		}: {
			to: string;
			disabled?: boolean;
			children: ReactNode;
		}) => (
			<a href={to} aria-disabled={disabled}>
				{children}
			</a>
		),
		{
			Icon: () => null,
			Label: ({ children }: { children: ReactNode }) => <span>{children}</span>,
			InfoButton: ({ children }: { children: ReactNode }) => (
				<span>{children}</span>
			)
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

vi.mock('@/shared/tailwind-ui', () => ({
	Icon: () => null
}));

vi.mock('./history-dialogs', () => ({
	HistoryHelpDialog: () => null,
	HistoryHelpTrendChartsDialog: () => null,
	HistoryHelpMeasurementSeriesDialog: () => null,
	HistoryHelpStackedChartsDialog: () => null
}));

vi.mock('./use-history-sidebar-state', () => ({
	useHistorySidebarState: vi.fn()
}));

describe('HistorySidebarNav', () => {
	it('uses saved chart URLs from sidebar state for enabled chart items', () => {
		vi.mocked(useHistorySidebarState).mockReturnValue({
			hasTrendData: false,
			hasSeriesData: false,
			isStackedAvailable: false,
			isTrendLoading: false,
			isSeriesLoading: false,
			lastLinearUrl: null,
			lastAggregationUrl: null,
			lastTrendUrl: '/history?mode=measurements&testName=saved-trend',
			lastSeriesUrl:
				'/history?mode=measurements-by-iteration&testName=saved-series',
			lastStackedUrl: null,
			lastMode: null,
			linearUrl: '/history?mode=linear&testName=current',
			aggregationUrl: '/history?mode=aggregation&testName=current',
			trendUrl: '/history?mode=measurements&testName=saved-trend',
			seriesUrl:
				'/history?mode=measurements-by-iteration&testName=saved-series',
			stackedUrl: null,
			mainLinkUrl: '/history?mode=linear&testName=current',
			setLastVisited: vi.fn()
		});

		render(<HistorySidebarNav />);

		expect(
			screen.getByText('Trend Charts').closest('a')?.getAttribute('href')
		).toBe('/history?mode=measurements&testName=saved-trend');
		expect(
			screen.getByText('Series Charts').closest('a')?.getAttribute('href')
		).toBe('/history?mode=measurements-by-iteration&testName=saved-series');
	});
});
