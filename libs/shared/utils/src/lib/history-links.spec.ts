/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stringifySearch } from '@/router';
import { RunDataResults, RunDetailsAPIResponse } from '@/shared/types';

import {
	getHistorySearch,
	type HistoryLinkProps,
	type HistorySearch
} from './router';

/** A link as the URL it opens: the wire search in `URLSearchParams` form. */
const urlOf = ({ to, search, state }: HistoryLinkProps) => ({
	url: `${to}${stringifySearch(search)}`,
	state
});

/**
 * The exact wire strings of the history links the run, log and measurements
 * pages build with `getHistorySearch`: they reach `/history`
 * unchanged, so the history page reads them through its schema as written
 * here. Values with spaces, `+`, `/`, `=` and `;` pin the encoding.
 */
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

const BASE =
	'page=1' +
	'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
	'&verdictLookup=string&startDate=2025-11-13&finishDate=2026-02-13' +
	'&testName=suite%2Fsmoke%2Ftest+case&runProperties=notcompromised';
const PARAMETERS = '&parameters=mode%3Dfast%3Btopology%3Dring%2B1';
const VERDICT = '&verdict=flaky+one%3Bx%3By';

const NARROWING: Record<keyof HistorySearch, string> = {
	testName: '',
	testNameAndVerdicts: VERDICT,
	testNameAndParameters: PARAMETERS,
	testNameAndParametersAndImportantTags: `${PARAMETERS}&runData=os%3Dlinux%3Barch%3Dx86_64`,
	testNameAndParametersAndAllTags: `${PARAMETERS}&runData=dut%3Dboard+a%3Bbranch%3Dmain%3Bos%3Dlinux%3Barch%3Dx86_64`,
	testNameAndParametersAndVerdicts: `${PARAMETERS}${VERDICT}`
};

describe('getHistorySearch wire strings', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-02-13T12:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each(Object.entries(NARROWING))(
		'%s: a direct link searches at once, a prefilled one opens the form',
		(key, narrowing) => {
			const { direct, prefilled } = getHistorySearch(
				run,
				result,
				'aggregation'
			);
			const shortcut = key as keyof HistorySearch;

			expect(urlOf(direct[shortcut])).toEqual({
				url: `/history?${BASE}${narrowing}&mode=aggregation`,
				state: { fromRun: false }
			});
			expect(urlOf(prefilled[shortcut])).toEqual({
				url: `/history?${BASE}${narrowing}&mode=aggregation&fromRun=true`,
				state: { fromRun: true }
			});
		}
	);

	it('writes the user preferred mode, linear included', () => {
		const { direct } = getHistorySearch(run, result, 'linear');

		expect(urlOf(direct.testName).url).toBe(`/history?${BASE}&mode=linear`);
	});
});
