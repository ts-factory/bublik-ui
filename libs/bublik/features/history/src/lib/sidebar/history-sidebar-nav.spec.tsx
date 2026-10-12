/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { RouterLinkWithProjectProps } from '@/bublik/features/projects';
import { joinTo, splitTarget } from '@/router';
import { renderWithRouter } from '@/router/testing';

import { HistorySidebarNav } from './history-sidebar-nav';
import { useHistorySidebarState } from './use-history-sidebar-state';

vi.mock('@/bublik/features/projects', () => ({
	RouterLinkWithProject: ({ to, children }: RouterLinkWithProjectProps) => (
		<a href={joinTo(splitTarget(to))}>{children}</a>
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
	Icon: () => null,
	cva: () => () => ''
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

const sidebarState = (
	overrides: Partial<ReturnType<typeof useHistorySidebarState>> = {}
): ReturnType<typeof useHistorySidebarState> => ({
	hasTrendData: false,
	hasSeriesData: false,
	isStackedAvailable: false,
	isTrendLoading: false,
	isSeriesLoading: false,
	lastLinearUrl: null,
	lastAggregationUrl: null,
	lastTrendUrl: null,
	lastSeriesUrl: null,
	lastStackedUrl: null,
	lastMode: null,
	linearUrl: '/history?mode=linear',
	aggregationUrl: '/history?mode=aggregation',
	trendUrl: '/history?mode=measurements',
	seriesUrl: '/history?mode=measurements-by-iteration',
	stackedUrl: null,
	mainLinkUrl: '/history?mode=linear',
	setLastVisited: vi.fn(),
	...overrides
});

describe('HistorySidebarNav', () => {
	it.each([
		['linear', 'linear'],
		['aggregation', 'aggregation'],
		['measurements', 'trend'],
		['measurements-by-iteration', 'series'],
		['measurements-combined', 'stacked']
	])(
		'remembers the history page in the %s mode as its own URL',
		async (mode, sidebarMode) => {
			const setLastVisited = vi.fn();
			vi.mocked(useHistorySidebarState).mockReturnValue(
				sidebarState({ setLastVisited })
			);
			const search = `?testName=a+b&mode=${mode}&page=2`;

			await renderWithRouter(<HistorySidebarNav />, {
				path: '/history',
				search
			});

			expect(setLastVisited).toHaveBeenCalledWith(
				sidebarMode,
				`/history${search}`
			);
		}
	);

	it.each([
		['the v2 alias', '/history/v2', '?testName=t&mode=linear'],
		['another page', '/runs', '?mode=linear'],
		['an unknown mode', '/history', '?testName=t&mode=other']
	])('remembers nothing on %s', async (_, path, search) => {
		const setLastVisited = vi.fn();
		vi.mocked(useHistorySidebarState).mockReturnValue(
			sidebarState({ setLastVisited })
		);

		await renderWithRouter(<HistorySidebarNav />, { path, search });

		expect(setLastVisited).not.toHaveBeenCalled();
	});

	it('uses saved chart URLs from sidebar state for enabled chart items', async () => {
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

		await renderWithRouter(<HistorySidebarNav />, { path: '/runs' });

		expect(
			screen.getByText('Trend Charts').closest('a')?.getAttribute('href')
		).toBe('/history?mode=measurements&testName=saved-trend');
		expect(
			screen.getByText('Series Charts').closest('a')?.getAttribute('href')
		).toBe('/history?mode=measurements-by-iteration&testName=saved-series');
	});
});
