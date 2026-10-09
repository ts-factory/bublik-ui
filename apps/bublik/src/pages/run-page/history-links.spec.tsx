/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stringifySearch } from '@/router';
import { renderWithRouter } from '@/router/testing';
import type { RunDataResults, RunDetailsAPIResponse } from '@/shared/types';
import { getHistorySearch, type HistorySearch } from '@/shared/utils';
import {
	LinkWithProject,
	RouterLinkWithProject
} from '@/bublik/features/projects';

import { historySearch } from '../../routes/-search/history.search';

// Values with spaces, `+`, `/`, `=` and `;`, as in `history-links.spec.ts`.
const run = {
	relevant_tags: ['dut=board a', 'branch=main'],
	important_tags: ['os=linux', 'arch=x86_64']
} as unknown as RunDetailsAPIResponse;

const result = {
	name: 'suite/smoke/test case',
	has_error: true,
	parameters: ['mode=fast', 'topology=ring+1'],
	obtained_result: { verdicts: ['flaky one', 'x;y'], result_type: 'FAILED' }
} as unknown as RunDataResults;

const SHORTCUTS: (keyof HistorySearch)[] = [
	'testName',
	'testNameAndVerdicts',
	'testNameAndParameters',
	'testNameAndParametersAndImportantTags',
	'testNameAndParametersAndAllTags',
	'testNameAndParametersAndVerdicts'
];

const hrefOf = (testId: string) =>
	screen.getByTestId(testId).getAttribute('href');

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-02-13T12:00:00'));
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

/**
 * The typed history links (`to="/history"`, the legacy codec's query string
 * as a wire search) render the href the string links did, through the
 * `/history` route's middlewares and with the sidebar state and projects of
 * the page carried over.
 */
describe('the history links of a result', () => {
	it.each(['direct', 'prefilled'] as const)(
		'%s: the typed link renders the string link’s href',
		async (kind) => {
			const links = getHistorySearch(run, result, 'aggregation')[kind];

			await renderWithRouter(
				<>
					{SHORTCUTS.map((shortcut) => (
						<div key={shortcut}>
							<LinkWithProject
								data-testid={`typed-${shortcut}`}
								{...links[shortcut]}
							/>
							<RouterLinkWithProject
								data-testid={`string-${shortcut}`}
								to={`/history${stringifySearch(links[shortcut].search)}`}
							/>
						</div>
					))}
				</>,
				{
					route: { id: '/_app/history/', search: historySearch },
					path: '/history',
					search: '?_s=abc&hide-sidebar=1&project=3&project=4'
				}
			);

			for (const shortcut of SHORTCUTS) {
				const typed = hrefOf(`typed-${shortcut}`);

				expect(typed).toMatch(/^\/v2\/history\?page=1&/);
				expect(typed).toMatch(/&_s=abc&hide-sidebar=1&project=3&project=4$/);
				expect(typed).toBe(hrefOf(`string-${shortcut}`));
			}
		}
	);
});
