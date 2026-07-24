/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RunDataResults, RunDetailsAPIResponse } from '@/shared/types';

import {
	getHistorySearch,
	HistorySearch,
	HistorySearchBuilder
} from './router';

const runFixture: RunDetailsAPIResponse = {
	finish: '2026-02-10T08:15:00.000Z',
	relevant_tags: ['dut=board-a', 'branch=main'],
	important_tags: ['os=linux', 'arch=x86_64']
} as unknown as RunDetailsAPIResponse;

const resultFixture: RunDataResults = {
	name: 'suite/smoke/test_case',
	has_error: true,
	parameters: ['mode=fast', 'topology=ring'],
	obtained_result: {
		verdicts: ['flaky'],
		result_type: 'FAILED'
	}
} as unknown as RunDataResults;

const getSearchParams = (item: HistorySearch[keyof HistorySearch]) => {
	const to = item.to;

	if (typeof to === 'string') {
		const [, search = ''] = to.split('?');
		return new URLSearchParams(search);
	}

	return new URLSearchParams(to.search ?? '');
};

describe('getHistorySearch', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-02-13T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not force result classification in any shortcut', () => {
		const { direct, prefilled } = getHistorySearch(
			runFixture,
			resultFixture,
			'linear'
		);

		const shortcuts: Array<keyof HistorySearch> = [
			'testName',
			'testNameAndVerdicts',
			'testNameAndParameters',
			'testNameAndParametersAndVerdicts',
			'testNameAndParametersAndImportantTags',
			'testNameAndParametersAndAllTags'
		];

		for (const key of shortcuts) {
			expect(getSearchParams(direct[key]).get('resultProperties')).toBeNull();
			expect(
				getSearchParams(prefilled[key]).get('resultProperties')
			).toBeNull();
		}
	});

	it('keeps fromRun only for prefilled shortcuts', () => {
		const { direct, prefilled } = getHistorySearch(
			runFixture,
			resultFixture,
			'aggregation'
		);

		expect(
			getSearchParams(direct.testNameAndParameters).get('fromRun')
		).toBeNull();
		expect(
			getSearchParams(prefilled.testNameAndParameters).get('fromRun')
		).toBe('true');
		expect(direct.testNameAndParameters.state).toEqual({ fromRun: false });
		expect(prefilled.testNameAndParameters.state).toEqual({ fromRun: true });
		expect(getSearchParams(direct.testNameAndParameters).get('mode')).toBe(
			'aggregation'
		);
	});

	it('uses the latest three months for every shortcut regardless of run age', () => {
		vi.setSystemTime(new Date('2026-07-24T12:00:00'));
		const oldRun = { ...runFixture, finish: '2024-01-10T08:15:00.000Z' };
		const { direct, prefilled } = getHistorySearch(
			oldRun,
			resultFixture,
			'linear'
		);

		for (const shortcuts of [direct, prefilled]) {
			for (const shortcut of Object.values(shortcuts)) {
				const query = getSearchParams(shortcut);

				expect(query.get('startDate')).toBe('2026-04-24');
				expect(query.get('finishDate')).toBe('2026-07-24');
			}
		}
	});

	it('can anchor a run-scoped search to the selected run', () => {
		const query = new HistorySearchBuilder('suite/test')
			.withRunIds([42])
			.withAnchorDate('2024-01-10T08:15:00.000Z')
			.build();

		expect(query.runIds).toBe('42');
		expect(query.startDate).toBe('2023-10-10');
		expect(query.finishDate).toBe('2024-01-10');
	});

	it('keeps testName + parameters link focused on parameters only', () => {
		const { direct } = getHistorySearch(runFixture, resultFixture, 'linear');
		const query = getSearchParams(direct.testNameAndParameters);

		expect(query.get('testName')).toBe(resultFixture.name);
		expect(query.get('parameters')).toBe(resultFixture.parameters.join(';'));
		expect(query.get('verdict')).toBeNull();
		expect(query.get('runData')).toBeNull();
		expect(query.get('resultProperties')).toBeNull();
	});

	it('uses provided path instead of result name', () => {
		const path = 'suite/group/subgroup/test_case';
		const { direct } = getHistorySearch(
			runFixture,
			resultFixture,
			'linear',
			path
		);

		expect(getSearchParams(direct.testName).get('testName')).toBe(path);
		expect(getSearchParams(direct.testNameAndParameters).get('testName')).toBe(
			path
		);
	});
});
