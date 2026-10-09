/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '../lib/history-state';

import { useLocation } from '../lib/compat/navigation';
import { writeSearch } from '../lib/search/use-search-writer';
import { renderHookWithRouter, renderWithRouter } from './render-with-router';

function ShowLocation() {
	const { pathname, search, hash } = useLocation();

	return <output>{`${pathname}${search}${hash}`}</output>;
}

describe('renderWithRouter', () => {
	it('renders the component at the given path, search and hash', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/runs/42',
			search: '?page=2&project=7',
			hash: 'top'
		});

		expect(screen.getByRole('status').textContent).toBe(
			'/runs/42?page=2&project=7#top'
		);
		expect(router.history.location.href).toBe(
			'/v2/runs/42?page=2&project=7#top'
		);
	});

	it('seeds location.state', async () => {
		function ShowState() {
			return (
				<output>
					{String(useLocation<{ fromRun?: boolean }>().state.fromRun)}
				</output>
			);
		}

		const { router } = await renderWithRouter(<ShowState />, {
			path: '/history',
			state: { fromRun: true }
		});

		expect(screen.getByRole('status').textContent).toBe('true');
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('serializes typed root keys the way the app does', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/runs'
		});

		await act(async () => {
			writeSearch(router, { 'settings-open': true, project: [3, 4] });
		});

		expect(router.history.location.href).toBe(
			'/v2/runs?settings-open=1&project=3&project=4'
		);
		expect(screen.getByRole('status').textContent).toBe(
			'/runs?settings-open=1&project=3&project=4'
		);
	});
});

describe('renderHookWithRouter', () => {
	it('runs the hook at the URL and re-runs it with new props', async () => {
		const { router, result, rerender } = await renderHookWithRouter(
			({ label }: { label: string }) => ({ label, location: useLocation() }),
			{ path: '/issues', search: 'state=open', initialProps: { label: 'a' } }
		);

		expect(result.current.location.search).toBe('?state=open');

		await act(async () => writeSearch(router, { page: '2' }));
		expect(result.current.location.search).toBe('?state=open&page=2');

		rerender({ label: 'b' });
		expect(result.current.label).toBe('b');
	});
});
