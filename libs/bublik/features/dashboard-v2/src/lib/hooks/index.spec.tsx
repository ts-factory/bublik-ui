/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';
import { DASHBOARD_MODE } from '@/shared/types';

import { dashboardSearch } from '@/shared/utils';
import {
	DASHBOARD_TABLE_ID,
	useDashboardClock,
	useDashboardDate,
	useDashboardModePicker,
	useDashboardModeSearch,
	useDashboardReload,
	useDashboardSearchTerm,
	useDashboardTvMode
} from './index';

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	invalidateTags: vi.fn(),
	useGetDashboardByDateQuery: vi.fn(),
	useGetDashboardModeQuery: vi.fn()
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
	useGetDashboardModeQuery: mocks.useGetDashboardModeQuery,
	usePrefetch: vi.fn()
}));

/** Every dashboard key read and written together, as the page does. */
function useDashboardState() {
	return {
		main: useDashboardDate(DASHBOARD_TABLE_ID.Main),
		secondary: useDashboardDate(DASHBOARD_TABLE_ID.Secondary),
		mode: useDashboardModeSearch(),
		term: useDashboardSearchTerm(),
		reload: useDashboardReload(),
		tv: useDashboardTvMode()
	};
}

/** The dashboard route, its search schema mounted, as in the app's route tree. */
const DASHBOARD_ROUTE = { id: '/_app/dashboard', search: dashboardSearch };

/** The hook in the dashboard page at `search`. */
function renderDashboardHook<Result>(hook: () => Result, search = '') {
	return renderHookWithRouter(hook, {
		route: DASHBOARD_ROUTE,
		path: '/dashboard',
		search
	});
}

describe('the dashboard search', () => {
	it('reads every key through the route codecs', async () => {
		const { result } = await renderDashboardHook(
			useDashboardState,
			'?main=2026-04-20&secondary=2026-04-19&mode=columns&search=abc&reload=1&tv=1'
		);

		expect(result.current.main.date).toEqual(new Date(2026, 3, 20));
		expect(result.current.secondary.date).toEqual(new Date(2026, 3, 19));
		expect(result.current.mode.mode).toBe('columns');
		expect(result.current.term.term).toBe('abc');
		expect(result.current.reload.isEnabled).toBe(true);
		expect(result.current.tv.isTvModeEnabled).toBe(true);
	});

	it('reads absent keys as no day, no mode, no term, reload and TV off', async () => {
		const { result } = await renderDashboardHook(useDashboardState);

		expect(result.current.main.date).toBeUndefined();
		expect(result.current.secondary.date).toBeUndefined();
		expect(result.current.mode.mode).toBeUndefined();
		expect(result.current.term.term).toBeUndefined();
		expect(result.current.reload.isEnabled).toBe(false);
		expect(result.current.tv.isTvModeEnabled).toBe(false);
	});

	it('reads an empty search term as the empty string', async () => {
		const { result } = await renderDashboardHook(
			useDashboardSearchTerm,
			'?search='
		);

		expect(result.current.term).toBe('');
	});

	it('reads an unparsable day as none and keeps it on the URL', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardState,
			'?main=not-a-date&mode=rows'
		);

		expect(result.current.main.date).toBeUndefined();

		await act(async () => result.current.tv.setIsTvModeEnabled(true));

		expect(router.history.location.search).toBe(
			'?main=not-a-date&mode=rows&tv=1'
		);
	});

	it('keeps the same day object across an unrelated write', async () => {
		const { result } = await renderDashboardHook(
			useDashboardState,
			'?main=2026-04-20'
		);
		const before = result.current.main.date;

		await act(async () => result.current.reload.setIsEnabled(true));

		expect(result.current.reload.isEnabled).toBe(true);
		expect(result.current.main.date).toBe(before);
	});

	it.each([
		[
			'a day',
			(state: ReturnType<typeof useDashboardState>) =>
				state.main.setDate(new Date(2026, 3, 21)),
			'?mode=rows&_s=abc&main=2026-04-21'
		],
		[
			'the second day',
			(state: ReturnType<typeof useDashboardState>) =>
				state.secondary.setDate(new Date(2026, 0, 2)),
			'?mode=rows&_s=abc&secondary=2026-01-02'
		],
		[
			'the mode',
			(state: ReturnType<typeof useDashboardState>) =>
				state.mode.setMode(DASHBOARD_MODE.Columns),
			'?mode=columns&_s=abc'
		],
		[
			'an empty search term as `search=`',
			(state: ReturnType<typeof useDashboardState>) => state.term.setTerm(''),
			'?mode=rows&_s=abc&search='
		],
		[
			'auto reload off as `reload=0`',
			(state: ReturnType<typeof useDashboardState>) =>
				state.reload.setIsEnabled(false),
			'?mode=rows&_s=abc&reload=0'
		],
		[
			'TV mode as `tv=1`',
			(state: ReturnType<typeof useDashboardState>) =>
				state.tv.setIsTvModeEnabled(true),
			'?mode=rows&_s=abc&tv=1'
		]
	])(
		'writes %s in place: merged, replaced, hash dropped, state kept',
		async (_, write, expected) => {
			const { result, router } = await renderHookWithRouter(useDashboardState, {
				path: '/dashboard',
				search: '?mode=rows&_s=abc',
				hash: 'top',
				state: { openUnexpected: true },
				route: DASHBOARD_ROUTE
			});
			const length = router.history.length;

			await act(async () => write(result.current));

			expect(router.history.location.pathname).toBe('/v2/dashboard');
			expect(router.history.location.search).toBe(expected);
			expect(router.history.location.hash).toBe('');
			expect(router.history.location.state).toMatchObject({
				openUnexpected: true
			});
			expect(router.history.length).toBe(length);
		}
	);

	it('removes a day that is reset', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardState,
			'?main=2026-04-20&mode=rows&secondary=2026-04-19'
		);

		await act(async () => {
			result.current.main.reset();
			result.current.secondary.setDate(null);
		});

		expect(router.history.location.search).toBe('?mode=rows');
	});
});

describe('useDashboardModePicker', () => {
	beforeEach(() => {
		mocks.useGetDashboardModeQuery.mockReset();
		mocks.useGetDashboardByDateQuery.mockReset();

		mocks.useGetDashboardModeQuery.mockReturnValue({
			data: DASHBOARD_MODE.RowsLine,
			isLoading: false
		});
		mocks.useGetDashboardByDateQuery.mockReturnValue({
			data: { date: '2026-04-20' }
		});
	});

	it('pins the day before the main day when switching to columns, in one entry', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardModePicker,
			'?main=2026-04-20&search=abc&project=3'
		);
		const { length } = router.history;
		const index = router.history.location.state.__TSR_index;

		await act(async () =>
			result.current.handleModeChange(DASHBOARD_MODE.Columns)
		);

		expect(router.history.location.search).toBe(
			'?main=2026-04-20&search=abc&project=3&secondary=2026-04-19&mode=columns'
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state.__TSR_index).toBe(index);
		expect(result.current.mode).toBe(DASHBOARD_MODE.Columns);
	});

	it('pins the latest day and the day before when switching to columns without a day', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardModePicker,
			'?project=3'
		);
		const { length } = router.history;

		await act(async () =>
			result.current.handleModeChange(DASHBOARD_MODE.Columns)
		);

		const latest = new Date('2026-04-20');
		const pad = (n: number) => String(n).padStart(2, '0');
		const day = (date: Date) =>
			`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
				date.getDate()
			)}`;
		const before = new Date(latest);
		before.setDate(before.getDate() - 1);

		expect(router.history.location.search).toBe(
			`?project=3&secondary=${day(before)}&main=${day(latest)}&mode=columns`
		);
		expect(router.history.length).toBe(length);
	});

	it('drops the second day when switching back to a single day', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardModePicker,
			'?main=2026-04-20&mode=columns&secondary=2026-04-19'
		);

		await act(async () => result.current.handleModeChange(DASHBOARD_MODE.Rows));

		expect(router.history.location.search).toBe('?main=2026-04-20&mode=rows');
	});

	it('writes nothing when the mode does not change', async () => {
		const { result, router } = await renderDashboardHook(
			useDashboardModePicker,
			'?mode=rows'
		);
		const before = router.history.location.href;

		await act(async () => result.current.handleModeChange(DASHBOARD_MODE.Rows));

		expect(router.history.location.href).toBe(before);
	});
});

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
		const { result } = await renderDashboardHook(() => useDashboardClock());

		act(() => result.current.refetch());

		expect(mocks.invalidateTags).toHaveBeenCalledWith(['DashboardData']);
		expect(mocks.dispatch).toHaveBeenCalledWith(invalidationAction);
	});

	it('skips dated queries when dates are not selected', async () => {
		await renderDashboardHook(() => useDashboardClock());

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
