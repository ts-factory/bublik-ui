/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// Run with `pnpm run e2e:unit`. Named `.unit.ts` so Playwright never collects it.
/* eslint-disable playwright/expect-expect -- node:assert, not Playwright's expect */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { loneResult } from './lone-result.ts';
import type { RunResult } from './lone-result.ts';

function result(
	resultId: number,
	testPath: string,
	parameters: string[],
	hasError = true
): RunResult {
	return { resultId, testPath, parameters, hasError };
}

describe('loneResult', () => {
	test('picks a result its parameters single out among its test', () => {
		const run = [
			result(563, 'suite/identify_basic', ['namespace=1']),
			result(564, 'suite/identify_basic', ['namespace=1']),
			result(570, 'suite/latency_randread', ['iodepth=32']),
			result(571, 'suite/latency_randread', ['iodepth=64'])
		];

		assert.equal(loneResult(run)?.resultId, 570);
	});

	test('skips a result whose parameters another result of its test also carries', () => {
		const run = [
			result(567, 'suite/throughput_rw', [
				'block_size=128k',
				'duration_sec=10'
			]),
			result(568, 'suite/throughput_rw', [
				'block_size=128k',
				'duration_sec=10',
				'warmup_sec=2'
			])
		];

		assert.equal(loneResult(run)?.resultId, 568);
	});

	test('prefers a failing result to one that passed', () => {
		const run = [
			result(7237, 'suite/latency_randread', ['iodepth=32'], false),
			result(7238, 'suite/latency_randread', ['iodepth=64'], true)
		];

		assert.equal(loneResult(run)?.resultId, 7238);
	});

	test('finds none when every result shares its parameters with another', () => {
		const run = [
			result(563, 'suite/identify_basic', ['namespace=1']),
			result(564, 'suite/identify_basic', ['namespace=1']),
			result(559, 'prologue', [])
		];

		assert.equal(loneResult(run), null);
	});
});
