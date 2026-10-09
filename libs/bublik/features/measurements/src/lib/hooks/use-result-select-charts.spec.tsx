/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { splitTo } from '@/router';
import { renderHookWithRouter } from '@/router/testing';

import { BASEPATH, MEASUREMENTS_ROUTE } from '../../test/measurements-router';
import { useMeasurementsMode, useSelectedChartIds } from '../route';
import { useResultSelectCharts } from './index';

const PAGE = '/runs/1/results/11/measurements';

function useSelection() {
	return {
		...useResultSelectCharts(),
		mode: useMeasurementsMode(),
		ids: useSelectedChartIds()
	};
}

async function renderAt(url: string, state?: Record<string, unknown>) {
	const { to, search, hash } = splitTo(url);
	const { result, router } = await renderHookWithRouter(useSelection, {
		route: MEASUREMENTS_ROUTE,
		path: to,
		search,
		hash,
		state
	});

	const selection = () => result.current;
	const href = () => router.history.location.href;

	return { router, selection, href };
}

describe('the measurements search', () => {
	it('reads the layout mode, default when absent', async () => {
		const plain = await renderAt(PAGE);
		expect(plain.selection().mode).toBe('default');

		const overlay = await renderAt(`${PAGE}?mode=overlay`);
		expect(overlay.selection().mode).toBe('overlay');
	});

	it('reads the selected charts from repeated keys, none when absent', async () => {
		const plain = await renderAt(PAGE);
		expect(plain.selection().selectedCharts).toEqual([]);

		const two = await renderAt(
			`${PAGE}?mode=overlay&selectedCharts=2&selectedCharts=3`
		);
		expect(two.selection().selectedCharts).toEqual([2, 3]);
	});
});

describe('selecting charts', () => {
	it('appends one repeated key per chart, replacing the entry and keeping the state', async () => {
		const { router, selection, href } = await renderAt(
			`${PAGE}?mode=default&_s=abc`,
			{ fromRun: true }
		);
		const length = router.history.length;

		act(() => selection().addChart(2));
		await waitFor(() =>
			expect(href()).toBe(
				`${BASEPATH}${PAGE}?mode=default&_s=abc&selectedCharts=2`
			)
		);

		act(() => selection().addChart(3));
		await waitFor(() =>
			expect(href()).toBe(
				`${BASEPATH}${PAGE}?mode=default&_s=abc&selectedCharts=2&selectedCharts=3`
			)
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('removes one chart in place and drops the key with the last one', async () => {
		const { selection, href } = await renderAt(
			`${PAGE}?selectedCharts=2&mode=default&selectedCharts=3`
		);

		act(() => selection().removeChart(2));
		await waitFor(() =>
			expect(href()).toBe(`${BASEPATH}${PAGE}?selectedCharts=3&mode=default`)
		);

		act(() => selection().handleChartClick({ id: 3 } as never));
		await waitFor(() => expect(href()).toBe(`${BASEPATH}${PAGE}?mode=default`));
	});

	it('resets the selection', async () => {
		const { selection, href } = await renderAt(
			`${PAGE}?mode=charts&selectedCharts=2&selectedCharts=3`
		);

		act(() => selection().resetCharts());
		await waitFor(() => expect(href()).toBe(`${BASEPATH}${PAGE}?mode=charts`));
	});
});

describe('the Open button of the selection', () => {
	it('pushes the overlay layout with the mode set in place, the hash and state dropped', async () => {
		const { router, selection, href } = await renderAt(
			`${PAGE}?mode=default&selectedCharts=2&selectedCharts=3&_s=abc&project=4#top`,
			{ fromRun: true }
		);
		const length = router.history.length;

		act(() => selection().handleOpenButtonClick());
		await waitFor(() =>
			expect(href()).toBe(
				`${BASEPATH}${PAGE}?mode=overlay&selectedCharts=2&selectedCharts=3&_s=abc&project=4`
			)
		);
		expect(router.history.length).toBe(length + 1);
		expect(router.history.location.state).not.toHaveProperty('fromRun');
		expect(selection().mode).toBe('overlay');
	});

	it('appends the mode when the URL has none', async () => {
		const { href, selection } = await renderAt(
			`${PAGE}?selectedCharts=2&selectedCharts=3`
		);

		act(() => selection().handleOpenButtonClick());
		await waitFor(() =>
			expect(href()).toBe(
				`${BASEPATH}${PAGE}?selectedCharts=2&selectedCharts=3&mode=overlay`
			)
		);
	});
});
