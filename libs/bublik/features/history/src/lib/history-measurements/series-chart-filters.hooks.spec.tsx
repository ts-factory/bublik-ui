/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import { useSeriesChartFilters } from './series-chart-filters.hooks';

/**
 * The series charts' filters repeat one key per value (`history.feature`,
 * "The parameter filter of the series charts repeats one key per
 * parameter") and are merged in with the entry replaced, the state kept.
 */
describe('useSeriesChartFilters', () => {
	it('reads the repeated keys, none as empty lists', async () => {
		const { result } = await renderHookWithRouter(
			() => useSeriesChartFilters(),
			{
				path: '/history',
				search:
					'?parametersByResultName=a+b&parametersByResultName=c&parametersByResultFilter=p%3D1'
			}
		);

		expect(result.current.selectedByName).toEqual(['a b', 'c']);
		expect(result.current.selectedByParam).toEqual(['p=1']);
	});

	it('writes one key per value, replacing the entry and keeping the state', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useSeriesChartFilters(),
			{
				path: '/history',
				search: '?testName=t&mode=measurements-by-iteration',
				state: { fromRun: true }
			}
		);
		const length = router.history.length;

		expect(result.current.selectedByName).toEqual([]);

		act(() => result.current.setSelectedByName(['x y', 'z']));
		act(() => result.current.setSelectedByParam(['p=1']));

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=measurements-by-iteration' +
					'&parametersByResultName=x+y&parametersByResultName=z' +
					'&parametersByResultFilter=p%3D1'
			)
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });

		act(() => result.current.setSelectedByName([]));
		act(() => result.current.setSelectedByParam(undefined));

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=measurements-by-iteration'
			)
		);
	});
});
