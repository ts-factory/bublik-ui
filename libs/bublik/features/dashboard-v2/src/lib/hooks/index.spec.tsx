/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDashboardClock } from './index';

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	invalidateTags: vi.fn(),
	queryParams: {} as Record<string, Date | undefined>,
	useGetDashboardByDateQuery: vi.fn()
}));

vi.mock('react-redux', () => ({
	useDispatch: () => mocks.dispatch
}));

vi.mock('use-query-params', () => ({
	BooleanParam: {},
	DateParam: {},
	StringParam: {},
	useQueryParam: (name: string) => [mocks.queryParams[name], vi.fn()],
	withDefault: (param: unknown) => param
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
		mocks.queryParams.main = undefined;
		mocks.queryParams.secondary = undefined;

		mocks.useGetDashboardByDateQuery.mockReturnValue({
			fulfilledTimeStamp: Date.now()
		});
	});

	it('invalidates all active dashboard queries on refresh', () => {
		const invalidationAction = { type: 'dashboard/invalidate' };
		mocks.invalidateTags.mockReturnValue(invalidationAction);
		const { result } = renderHook(() => useDashboardClock());

		act(() => result.current.refetch());

		expect(mocks.invalidateTags).toHaveBeenCalledWith(['DashboardData']);
		expect(mocks.dispatch).toHaveBeenCalledWith(invalidationAction);
	});

	it('skips dated queries when dates are not selected', () => {
		renderHook(() => useDashboardClock());

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
