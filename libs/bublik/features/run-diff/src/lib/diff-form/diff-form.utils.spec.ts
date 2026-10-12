/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { extractRunId } from './diff-form.utils';

describe('extractRunId', () => {
	it('takes a run id as a number', () => {
		expect(extractRunId('1132')).toBe(1132);
		expect(extractRunId(' 42 ')).toBe(42);
	});

	it.each([
		['https://bublik.example/v2/runs/1151', 1151],
		['https://bublik.example/v2/runs/1151/', 1151],
		['https://bublik.example/v2/runs/1151//', 1151],
		['https://bublik.example/V2/Runs/1151', 1151],
		['https://bublik.example/v2/runs/1151?mode=table#top', 1151],
		['https://bublik.example/v2/runs/%31151', 1151]
	])('reads the run id of the run page URL %s', (url, runId) => {
		expect(extractRunId(url)).toBe(runId);
	});

	it.each([
		'https://bublik.example/v2/runs/1151/report',
		'https://bublik.example/prefix/v2/runs/1151',
		'https://bublik.example/v2/runs',
		'https://bublik.example/v2/log/1151'
	])('rejects %s, which is not a run page', (url) => {
		expect(extractRunId(url)).toEqual(new Error('Invalid run URL format'));
	});

	it('rejects what is neither a number nor a URL', () => {
		expect(extractRunId('run 42')).toEqual(new Error('Invalid run ID or URL'));
	});
});
