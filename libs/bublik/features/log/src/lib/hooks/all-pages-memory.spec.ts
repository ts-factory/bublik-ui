/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	ALL_PAGES_MEMORY_TTL,
	getAllPagesMemoryKey,
	isAllPagesRemembered,
	updateAllPagesMemory,
	type AllPagesIdentity
} from './all-pages-memory';

const NOW = Date.parse('2026-07-29T10:00:00.000Z');
const IDENTITY: AllPagesIdentity = {
	projectId: 10,
	runId: 20,
	path: 'package/session/test'
};

describe('all pages memory', () => {
	it('isolates entries by project, run, and node path', () => {
		const key = getAllPagesMemoryKey(IDENTITY);

		expect(
			getAllPagesMemoryKey({ ...IDENTITY, projectId: IDENTITY.projectId + 1 })
		).not.toBe(key);
		expect(
			getAllPagesMemoryKey({ ...IDENTITY, runId: Number(IDENTITY.runId) + 1 })
		).not.toBe(key);
		expect(
			getAllPagesMemoryKey({ ...IDENTITY, path: 'other/session/test' })
		).not.toBe(key);
	});

	it('remembers an entry for 24 hours', () => {
		const memory = updateAllPagesMemory({}, IDENTITY, true, NOW);

		expect(isAllPagesRemembered(memory, IDENTITY, NOW)).toBe(true);
		expect(
			isAllPagesRemembered(memory, IDENTITY, NOW + ALL_PAGES_MEMORY_TTL - 1)
		).toBe(true);
		expect(
			isAllPagesRemembered(memory, IDENTITY, NOW + ALL_PAGES_MEMORY_TTL)
		).toBe(false);
	});

	it('forgets an entry when a specific page is selected', () => {
		const remembered = updateAllPagesMemory({}, IDENTITY, true, NOW);
		const forgotten = updateAllPagesMemory(
			remembered,
			IDENTITY,
			false,
			NOW + 1
		);

		expect(isAllPagesRemembered(forgotten, IDENTITY, NOW + 1)).toBe(false);
	});

	it('removes expired entries while updating memory', () => {
		const expiredIdentity = { ...IDENTITY, path: 'package/session/expired' };
		const expiredKey = getAllPagesMemoryKey(expiredIdentity);
		const memory = updateAllPagesMemory(
			{ [expiredKey]: NOW - 1 },
			IDENTITY,
			true,
			NOW
		);

		expect(memory).not.toHaveProperty(expiredKey);
	});
});
