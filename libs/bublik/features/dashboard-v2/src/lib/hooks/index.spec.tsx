/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import { useDashboardClock, useDashboardReload } from './index';

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	invalidateTags: vi.fn(),
	useGetDashboardByDateQuery: vi.fn()
}));

vi.mock('react-redux', () => ({
	useDispatch: () => mocks.dispatch
}));

vi.mock('@/bublik/features/projects', () => ({
	useProjectSearch: () => ({ projectIds: [7] })
}));

vi.mock('@/bublik/features/analytics', () => ({
	analyticsEventNames: {},
	trackEvent: vi.fn()
}));

vi.mock('@/services/bublik-api', () => ({
	BUBLIK_TAG: { DashboardData: 'DashboardData' },
	bublikAPI: {
		util: { invalidateTags: mocks.invalidateTags }
	},
	useGetDashboardByDateQuery: mocks.useGetDashboardByDateQuery,
	useGetDashboardModeQuery: vi.fn(),
	usePrefetch: vi.fn()
}));
describe('useDashboardClock', () => {
	beforeEach(() => {
		mocks.dispatch.mockReset();
		mocks.invalidateTags.mockReset();
		mocks.useGetDashboardByDateQuery.mockReset();

		mocks.useGetDashboardByDateQuery.mockReturnValue({
			fulfilledTimeStamp: Date.now()
		});
	});

	it('invalidates all active dashboard queries on refresh', async () => {
		const invalidationAction = { type: 'dashboard/invalidate' };
		mocks.invalidateTags.mockReturnValue(invalidationAction);
		const { result } = await renderHookWithRouter(() => useDashboardClock(), {
			path: '/dashboard'
		});

		act(() => result.current.refetch());

		expect(mocks.invalidateTags).toHaveBeenCalledWith(['DashboardData']);
		expect(mocks.dispatch).toHaveBeenCalledWith(invalidationAction);
	});

	it('skips dated queries when dates are not selected', async () => {
		await renderHookWithRouter(() => useDashboardClock(), {
			path: '/dashboard'
		});

		expect(mocks.useGetDashboardByDateQuery).toHaveBeenNthCalledWith(1, {
			projects: [7]
		});
		expect(mocks.useGetDashboardByDateQuery).toHaveBeenNthCalledWith(
			2,
			undefined,
			{ skip: true }
		);
		expect(mocks.useGetDashboardByDateQuery).toHaveBeenNthCalledWith(
			3,
			undefined,
			{ skip: true }
		);
	});
});

describe('useDashboardReload', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('is off by default', async () => {
		const { result } = await renderHookWithRouter(() => useDashboardReload(), {
			path: '/dashboard'
		});

		expect(result.current.isEnabled).toBe(false);
	});

	it('restores the saved toggle when the URL has no reload param', async () => {
		localStorage.setItem('dashboard-auto-reload', 'true');

		const { result } = await renderHookWithRouter(() => useDashboardReload(), {
			path: '/dashboard'
		});

		expect(result.current.isEnabled).toBe(true);
	});

	it('lets the URL override the saved toggle', async () => {
		localStorage.setItem('dashboard-auto-reload', 'true');

		const { result } = await renderHookWithRouter(() => useDashboardReload(), {
			path: '/dashboard',
			search: 'reload=0'
		});

		expect(result.current.isEnabled).toBe(false);
	});

	it('saves the toggle and writes it to the URL', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useDashboardReload(),
			{ path: '/dashboard' }
		);

		await act(async () => result.current.setIsEnabled(true));

		expect(localStorage.getItem('dashboard-auto-reload')).toBe('true');
		expect(
			new URLSearchParams(router.history.location.search).get('reload')
		).toBe('1');
		expect(result.current.isEnabled).toBe(true);
	});
});
