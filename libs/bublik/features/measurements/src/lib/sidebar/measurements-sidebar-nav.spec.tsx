/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { render, screen, waitFor } from '@testing-library/react';
import { skipToken } from '@reduxjs/toolkit/query';
import { RouterProvider } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LinkWithProjectProps } from '@/bublik/features/projects';
import {
	getSidebarStateString,
	MEASUREMENTS_SIDEBAR_KEYS
} from '@/bublik/features/sidebar';
import { joinTo, splitTarget } from '@/router';
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';

import { createMeasurementsRouter } from '../../test/measurements-router';
import { MeasurementsSidebarNav } from './measurements-sidebar-nav';

vi.mock('@/services/bublik-api', () => ({
	useGetSingleMeasurementQuery: vi.fn()
}));

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: ({ to, children }: LinkWithProjectProps) => (
		<a href={joinTo(splitTarget(to))}>{children}</a>
	)
}));

vi.mock('@/bublik/features/sidebar-nav', () => {
	const passThrough = ({ children }: { children?: ReactNode }) => (
		<div>{children}</div>
	);
	const link = ({
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
	);
	const label = ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	);

	return {
		SidebarNavCollapsibleContainer: Object.assign(passThrough, {
			Item: passThrough,
			Submenu: passThrough
		}),
		SidebarNavInternalLink: Object.assign(link, {
			Icon: () => null,
			Label: label
		}),
		SidebarNavLinkWrapper: passThrough,
		SidebarNavSubmenuItemContainer: Object.assign(link, {
			Icon: () => null,
			Label: label,
			InfoButton: () => null
		}),
		SidebarNavInfoButton: () => null,
		SidebarNavToggle: () => null
	};
});

vi.mock('@/shared/tailwind-ui', () => ({
	Icon: () => null,
	cva: () => () => ''
}));

vi.mock('./measurements-dialog', () => ({
	ResultMeasurementsDialog: () => null
}));

const PAGE = '/runs/1/results/11/measurements';

async function renderSidebarAt(url: string) {
	// The sidebar sits in the app layout, outside the page's match.
	const router = createMeasurementsRouter({
		url,
		layout: <MeasurementsSidebarNav />
	});
	await router.load();
	render(<RouterProvider router={router} />);

	return router;
}

function linkTo(label: string): HTMLAnchorElement {
	return screen.getByText(label).closest('a') as HTMLAnchorElement;
}

function sidebarState(router: { history: { location: { search: string } } }) {
	const params = new URLSearchParams(router.history.location.search);

	return {
		lastMeasurements: getSidebarStateString(
			params,
			MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS
		),
		lastMode: getSidebarStateString(params, MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE)
	};
}

beforeEach(() => {
	vi.mocked(useGetSingleMeasurementQuery).mockImplementation(((
		resultId: unknown
	) =>
		resultId === skipToken
			? { data: undefined, isLoading: false }
			: {
					data: { charts: [{ id: 1 }, { id: 2 }] },
					isLoading: false
			  }) as never);
});

describe('MeasurementsSidebarNav', () => {
	it('reads the result of the page on screen from outside its route, enabling Stacked Charts', async () => {
		await renderSidebarAt(`${PAGE}?mode=split`);

		await waitFor(() =>
			expect(linkTo('Stacked Charts').getAttribute('aria-disabled')).toBe(
				'false'
			)
		);
		expect(useGetSingleMeasurementQuery).toHaveBeenCalledWith('11');
	});

	it('remembers the pathname alone and the mode in the sidebar state', async () => {
		const router = await renderSidebarAt(
			`${PAGE}?mode=split&selectedCharts=2&project=4`
		);

		await waitFor(() =>
			expect(sidebarState(router)).toEqual({
				lastMeasurements: PAGE,
				lastMode: 'split'
			})
		);
		expect(linkTo('Result').getAttribute('href')).toBe(`${PAGE}?mode=split`);
		expect(linkTo('Charts + Tables').getAttribute('href')).toBe(PAGE);
		expect(linkTo('Charts || Tables').getAttribute('href')).toBe(
			`${PAGE}?mode=split`
		);
		expect(linkTo('Measurement Tables').getAttribute('href')).toBe(
			`${PAGE}?mode=tables`
		);
		expect(linkTo('Stacked Charts').getAttribute('href')).toBe(
			`${PAGE}?mode=overlay`
		);
	});

	it('remembers a page without a mode as the default one, which compacts away', async () => {
		const router = await renderSidebarAt(PAGE);

		await waitFor(() =>
			expect(sidebarState(router)).toEqual({
				lastMeasurements: PAGE,
				lastMode: null
			})
		);
	});

	it('offers nothing before a result was visited', async () => {
		await renderSidebarAt('/runs');

		expect(linkTo('Result').getAttribute('href')).toBe('/runs');
		expect(linkTo('Stacked Charts').getAttribute('aria-disabled')).toBe('true');
		expect(useGetSingleMeasurementQuery).toHaveBeenLastCalledWith(skipToken);
	});
});
