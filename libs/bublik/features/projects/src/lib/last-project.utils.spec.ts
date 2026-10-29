/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { afterEach, describe, expect, it } from 'vitest';

import {
	LAST_PROJECT_STORAGE_KEY,
	forgetLastProjectId,
	readLastProjectIds,
	withLastProjectIds,
	writeLastProjectIds
} from './last-project.utils';

afterEach(() => window.localStorage.clear());

describe('last selected project storage', () => {
	it('round-trips the selected project ids', () => {
		writeLastProjectIds([3]);

		expect(readLastProjectIds()).toEqual([3]);
	});

	it('reads nothing when storage is empty or malformed', () => {
		expect(readLastProjectIds()).toEqual([]);

		window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, '{not json');
		expect(readLastProjectIds()).toEqual([]);

		window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, '["2", 0, 5]');
		expect(readLastProjectIds()).toEqual([5]);
	});

	it('forgets a deleted project', () => {
		writeLastProjectIds([2, 4]);
		forgetLastProjectId(2);

		expect(readLastProjectIds()).toEqual([4]);
	});
});

describe('withLastProjectIds', () => {
	it('adds the remembered project when the URL has none', () => {
		const result = withLastProjectIds(new URLSearchParams('mode=rows'), [2]);

		expect(result?.toString()).toBe('mode=rows&project=2');
	});

	it('keeps the project the URL already has', () => {
		expect(withLastProjectIds(new URLSearchParams('project=1'), [2])).toBe(
			null
		);
	});

	it('changes nothing when All was the last choice', () => {
		expect(withLastProjectIds(new URLSearchParams('mode=rows'), [])).toBe(null);
	});
});
