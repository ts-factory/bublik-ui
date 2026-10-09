/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/router/testing';
import type { SingleMeasurementChart } from '@/services/bublik-api';

import {
	CombinedChartsProvider,
	useCombinedCharts
} from './combined-charts.context';

const BASEPATH = '/v2';
const plot = (id: number) => ({ id } as unknown as SingleMeasurementChart);

/**
 * The trend view's stacked selection (`history.feature`):
 * `combinedPlots` joins the chart ids with `;` and replaces the entry,
 * dropping `location.state` as the React Router write did; `chart-group`
 * is merged in, the entry replaced. Opening the stacked view pushes it on
 * `/history`.
 */
async function renderCharts(path = '/history') {
	const charts: { current: ReturnType<typeof useCombinedCharts> | null } = {
		current: null
	};
	function Probe() {
		charts.current = useCombinedCharts();
		return null;
	}

	const { router } = await renderWithRouter(
		<CombinedChartsProvider>
			<Probe />
		</CombinedChartsProvider>,
		{
			path,
			search: '?testName=t&mode=measurements&_s=x',
			hash: 'top',
			state: { fromRun: true }
		}
	);
	const get = () => {
		if (!charts.current) throw new Error('not rendered');
		return charts.current;
	};

	return { router, get };
}

describe('CombinedChartsProvider', () => {
	it('records the selection and its group, replacing the entry', async () => {
		const { router, get } = await renderCharts();
		const length = router.history.length;

		act(() =>
			get().handleAddChartClick({ plot: plot(1), color: 'red', group: 'trend' })
		);

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				`${BASEPATH}/history?testName=t&mode=measurements&_s=x&combinedPlots=1&chart-group=trend`
			)
		);
		expect(router.history.location.state).not.toHaveProperty('fromRun');
		expect(get().selectedGroup).toBe('trend');

		act(() =>
			get().handleAddChartClick({
				plot: plot(2),
				color: 'blue',
				group: 'trend'
			})
		);

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=measurements&_s=x&combinedPlots=1%3B2&chart-group=trend'
			)
		);
		expect(router.history.length).toBe(length);
	});

	it.each(['/history', '/history/v2'])(
		'%s: opening the stacked view pushes it on /history',
		async (path) => {
			const { router, get } = await renderCharts(path);

			act(() =>
				get().handleAddChartClick({
					plot: plot(7),
					color: 'red',
					group: 'measurement'
				})
			);
			await waitFor(() =>
				expect(router.history.location.search).toContain('chart-group')
			);
			const length = router.history.length;

			act(() => get().handleOpenButtonClick());

			await waitFor(() =>
				expect(router.history.location.href).toBe(
					`${BASEPATH}/history?testName=t&mode=measurements-combined&_s=x&combinedPlots=7&chart-group=measurement`
				)
			);
			expect(router.history.length).toBe(length + 1);
		}
	);

	it.each([
		['removing the last chart', 'remove'],
		['resetting the selection', 'reset']
	])('%s drops both keys', async (_, how) => {
		const { router, get } = await renderCharts();

		act(() =>
			get().handleAddChartClick({ plot: plot(1), color: 'red', group: 'trend' })
		);
		await waitFor(() =>
			expect(router.history.location.search).toContain('chart-group')
		);

		act(() =>
			how === 'remove'
				? get().handleRemoveClick(plot(1))
				: get().handleResetButtonClick()
		);

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=measurements&_s=x'
			)
		);
		expect(get().selectedCharts).toEqual([]);
	});
});
