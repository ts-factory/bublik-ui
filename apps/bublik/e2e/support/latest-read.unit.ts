/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// Run with `pnpm run e2e:unit`. Named `.unit.ts` so Playwright never collects it.
/* eslint-disable playwright/expect-expect -- node:assert, not Playwright's expect */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { latestRead } from './latest-read.ts';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

describe('latestRead', () => {
	test('reads once per key', async () => {
		let reads = 0;
		const latest = latestRead<string>();
		const read = (key: string) =>
			latest(key, () => Promise.resolve(`${key}${++reads}`));

		assert.equal(await read('a'), 'a1');
		assert.equal(await read('a'), 'a1');
		assert.equal(await read('b'), 'b2');
	});

	test('a failed read is tried again', async () => {
		let reads = 0;
		const latest = latestRead<number>();
		const read = (key: string) =>
			latest(key, async () => {
				reads += 1;
				if (reads === 1) throw new Error('down');

				return reads;
			});

		await assert.rejects(read('a'), /down/);
		assert.equal(await read('a'), 2);
	});

	test("an outdated read's failure keeps the newer read", async () => {
		const old = deferred<string>();
		let reads = 0;
		const latest = latestRead<string>();
		const read = (key: string) =>
			latest(key, () => {
				reads += 1;

				return key === 'old' ? old.promise : Promise.resolve(key);
			});

		const outdated = read('old');
		assert.equal(await read('new'), 'new');
		old.reject(new Error('down'));
		await assert.rejects(outdated, /down/);

		assert.equal(await read('new'), 'new');
		assert.equal(reads, 2);
	});
});
