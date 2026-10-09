/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { parseSearch } from '@/router';
import { HistoryDataLinear } from '@/shared/types';
import { historySearch } from '@/shared/utils';

import { getHistoryShortcuts } from './links.utils';

const row = {
	relevant_tags: ['dut=a b', 'x+y'],
	important_tags: ['os=linux'],
	metadata: ['m=1;2'],
	parameters: ['p=1', 'q=a b'],
	obtained_result: { verdicts: ['v 1', 'v2'], result_type: 'FAILED' },
	has_error: true
} as unknown as HistoryDataLinear;

/** The search the page reads at `searchStr`, through the history schema. */
const searchAt = (searchStr: string) =>
	historySearch.validateSearch(parseSearch(searchStr));

const ALL_RESULTS =
	'results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC';
const PARAMETERS = 'parameters=p%3D1%3Bq%3Da+b';
const RUN_DATA = 'runData=dut%3Da+b%3Bx%2By%3Bos%3Dlinux%3Bm%3D1%3B2';
const RUN_DATA_IMPORTANT_FIRST =
	'runData=os%3Dlinux%3Bdut%3Da+b%3Bx%2By%3Bm%3D1%3B2';
const VERDICT = 'verdict=v+1%3Bv2';

// The strings the legacy `useSearchState` + `stringifySearch` pair produced
// for the same searches, as `LinkWithProject` puts them on the link.
describe('getHistoryShortcuts', () => {
	it('carries the test path, dates, page size, mode and lists of the current search', () => {
		const base =
			'testName=suite%2Ftest&mode=linear&page=1&pageSize=50&hash=abc' +
			'&startDate=2026-01-01&finishDate=2026-04-01&verdictLookup=string' +
			'&branches=main%3Bdev';

		expect(
			getHistoryShortcuts(
				row,
				searchAt(
					'?testName=suite%2Ftest&mode=linear&page=3&pageSize=50&hash=abc' +
						'&startDate=2026-01-01&finishDate=2026-04-01&branches=main%3Bdev' +
						'&parameters=a%3D1%3Bb%3D2&resultProperties=expected' +
						'&results=PASSED%3BFAILED&runProperties=notcompromised' +
						'&project=1&project=2&_s=xyz'
				)
			)
		).toEqual({
			allUnexpected: `?${base}&${PARAMETERS}&resultProperties=unexpected&${ALL_RESULTS}&${RUN_DATA}`,
			similarUnexpected: `?${base}&${PARAMETERS}&resultProperties=unexpected&${ALL_RESULTS}&${RUN_DATA}&${VERDICT}`,
			historyQuery: `?${base}&${PARAMETERS}&resultProperties=unexpected&results=FAILED&${RUN_DATA_IMPORTANT_FIRST}&${VERDICT}&runProperties=notcompromised`
		});
	});

	it('keeps the empty keys the form wrote as empty keys', () => {
		const base =
			'testName=t&mode=aggregation&page=1&pageSize=25&verdictLookup=string&branches=';

		expect(
			getHistoryShortcuts(
				row,
				searchAt(
					'?testName=t&labels=&parameters=&revisions=&branches=&runData=' +
						'&results=&resultProperties=&runProperties=&verdict=' +
						'&mode=aggregation&page=1&pageSize=25&untriaged=&explained='
				)
			).historyQuery
		).toBe(
			`?${base}&${PARAMETERS}&resultProperties=unexpected&results=FAILED&${RUN_DATA_IMPORTANT_FIRST}&${VERDICT}&runProperties=`
		);
	});

	it('leaves out what the current search does not carry', () => {
		expect(getHistoryShortcuts(row, searchAt('')).allUnexpected).toBe(
			`?page=1&verdictLookup=string&${PARAMETERS}&resultProperties=unexpected&${ALL_RESULTS}&${RUN_DATA}`
		);
	});

	it('reads a space written as `+` as a space (the legacy codec kept the `+`)', () => {
		expect(
			getHistoryShortcuts(row, searchAt('?testName=a+b')).historyQuery
		).toMatch(/^\?testName=a\+b&page=1&/);
		expect(
			new URLSearchParams(
				getHistoryShortcuts(row, searchAt('?testName=a+b')).historyQuery
			).get('testName')
		).toBe('a b');
	});
});
