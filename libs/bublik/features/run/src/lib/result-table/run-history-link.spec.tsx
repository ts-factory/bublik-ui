/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { legacyStringifySearch } from '@/router';
import { renderWithRouter } from '@/router/testing';
import {
	LinkWithProject,
	TypedLinkWithProject
} from '@/bublik/features/projects';
import { HistorySearchBuilder, historySearch } from '@/shared/utils';

import { getHistoryViewSearch } from './run-history-link';

// The target route with its schema, so the typed search is written by the
// `/history` codecs as in the app.
const HISTORY_ROUTE = { id: '/_app/history', search: historySearch };
const CARRIED = '_s=abc&hide-sidebar=1&project=3&project=4';

function hrefOf(testId: string) {
	return screen.getByTestId(testId).getAttribute('href');
}

beforeEach(() => {
	// The router scrolls the window once on load; jsdom has no `scrollTo`.
	vi.stubGlobal('scrollTo', vi.fn());
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-02-13T12:00:00'));
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('the result table history link', () => {
	it('opens the history of the node in the runs, as the legacy codec wrote it', async () => {
		const path = ['suite', 'test case+1'];
		const legacy = new HistorySearchBuilder(path.join('/'))
			.withRunIds([1, 2])
			.withAnchorDate('2026-01-10T08:00:00')
			.build();

		await renderWithRouter(
			<>
				<TypedLinkWithProject
					data-testid="typed"
					to="/history"
					search={getHistoryViewSearch(path, [1, 2], '2026-01-10T08:00:00')}
				/>
				<LinkWithProject
					data-testid="string"
					to={{ pathname: '/history', search: legacyStringifySearch(legacy) }}
				/>
			</>,
			{
				route: HISTORY_ROUTE,
				path: '/history',
				search: `?mode=linear&_s=abc&hide-sidebar=1&project=3&project=4`
			}
		);

		expect(hrefOf('typed')).toBe(hrefOf('string'));
		expect(hrefOf('typed')).toBe(
			'/v2/history?page=1' +
				'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
				'&verdictLookup=string&startDate=2025-10-10&finishDate=2026-01-10' +
				'&testName=suite%2Ftest+case%2B1&runProperties=notcompromised&runIds=1%3B2' +
				`&${CARRIED}`
		);
	});

	it('keeps the default window when the run has no finish date', async () => {
		await renderWithRouter(
			<TypedLinkWithProject
				data-testid="typed"
				to="/history"
				search={getHistoryViewSearch(['suite'], [7])}
			/>,
			{ route: HISTORY_ROUTE, path: '/history' }
		);

		expect(hrefOf('typed')).toBe(
			'/v2/history?page=1' +
				'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
				'&verdictLookup=string&startDate=2025-11-13&finishDate=2026-02-13' +
				'&testName=suite&runProperties=notcompromised&runIds=7'
		);
	});
});
