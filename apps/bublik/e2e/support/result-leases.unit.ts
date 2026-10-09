/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// Run with `pnpm run e2e:unit`. Named `.unit.ts` so Playwright never collects it.
/* eslint-disable playwright/expect-expect -- node:assert, not Playwright's expect */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, test } from 'node:test';

import { LeaseBook } from './result-leases.ts';
import type { LeasableResult } from './result-leases.ts';

function result(
	runId: number,
	resultId: number,
	testPath: string,
	iteration: number
): LeasableResult {
	return { runId, resultId, testPath, iteration };
}

/**
 * Two runs shaped like the basic fixture: `identify` runs twice with the same
 * iteration, every other test once per iteration.
 */
const POOL: LeasableResult[] = [10, 20].flatMap((runId) => [
	result(runId, runId * 10 + 1, 'suite/identify', 6),
	result(runId, runId * 10 + 2, 'suite/identify', 6),
	result(runId, runId * 10 + 3, 'suite/throughput', 9),
	result(runId, runId * 10 + 4, 'suite/latency', 13),
	result(runId, runId * 10 + 5, 'suite/latency', 14)
]);

/** The pid of a process that has already exited. */
function deadPid(): number {
	return spawnSync(process.execPath, ['-e', '']).pid as number;
}

let dir = '';

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'result-leases-'));
});

describe('LeaseBook', () => {
	test('two scenarios never lease the same result at once', () => {
		const first = new LeaseBook(dir, 'first');
		const second = new LeaseBook(dir, 'second');

		const a = first.tryResult(POOL);
		const b = second.tryResult(POOL);

		assert.ok(a && b);
		assert.notEqual(a.resultId, b.resultId);
	});

	test('every result can be leased once, then none is left', () => {
		const books = POOL.map((_, index) => new LeaseBook(dir, `s${index}`));
		const leased = books.map((book) => book.tryResult(POOL)?.resultId);

		assert.equal(new Set(leased).size, POOL.length);
		assert.equal(new LeaseBook(dir, 'late').tryResult(POOL), null);
	});

	test('a released result can be leased again', () => {
		const books = POOL.map((_, index) => new LeaseBook(dir, `s${index}`));
		books.forEach((book) => book.tryResult(POOL));
		const freed = books[3].held()[0];

		books[3].release();

		assert.equal(new LeaseBook(dir, 'next').tryResult(POOL)?.resultId, freed);
	});

	test('a lease whose process has exited is taken over', () => {
		writeFileSync(
			join(dir, 'result-101'),
			JSON.stringify({ pid: deadPid(), label: 'crashed' })
		);

		const leased = new LeaseBook(dir, 'next').tryResult(POOL);

		assert.equal(leased?.resultId, 101);
	});

	test('two scenarios taking over the same dead lease do not both get it', () => {
		const dead = deadPid();
		writeFileSync(
			join(dir, 'result-101'),
			JSON.stringify({ pid: dead, label: 'crashed' })
		);
		const first = new LeaseBook(dir, 'first');
		const taken: { first?: LeasableResult | null } = {};
		// `second` finds the owner dead, and before it acts on that, `first`
		// takes the lease over.
		const second = new LeaseBook(dir, 'second', {
			isAlive: (pid) => {
				if (pid === dead && taken.first === undefined) {
					taken.first = first.tryResult(POOL);
				}

				return pid !== dead;
			}
		});

		const secondLeased = second.tryResult(POOL);

		assert.equal(taken.first?.resultId, 101);
		assert.ok(secondLeased);
		assert.notEqual(secondLeased.resultId, 101);
		assert.equal(
			JSON.parse(readFileSync(join(dir, 'result-101'), 'utf-8')).label,
			'first'
		);
		assert.deepEqual(
			readdirSync(dir).filter((name) => name.includes('.')),
			[]
		);
	});

	test('a test lease gets every result of one test, in a run nobody else leases from', () => {
		const stamp = new LeaseBook(dir, 'stamp');
		const apply = new LeaseBook(dir, 'apply');

		const taken = stamp.tryResult(POOL);
		const group = apply.tryTest(POOL);

		assert.ok(taken && group);
		assert.ok(group.every((entry) => entry.runId !== taken.runId));
		assert.deepEqual(
			group.map((entry) => entry.resultId),
			[201, 202]
		);
	});

	test('no result is leased from a run a test lease holds', () => {
		const apply = new LeaseBook(dir, 'apply');
		const group = apply.tryTest(POOL);
		assert.ok(group);

		const books = [1, 2, 3, 4, 5, 6].map(
			(index) => new LeaseBook(dir, `s${index}`)
		);
		const leased = books.map((book) => book.tryResult(POOL));

		assert.ok(leased.every((entry) => entry?.runId !== group[0].runId));
		assert.equal(leased.filter(Boolean).length, 5);
	});

	test('a test lease waits for a run with no other lease in it', () => {
		new LeaseBook(dir, 'a').tryResult(POOL);
		new LeaseBook(dir, 'b').tryTest(POOL);

		assert.equal(new LeaseBook(dir, 'c').tryTest(POOL), null);
	});
});
