/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ImportRunInput } from '@/shared/types';

import {
	buildImportRunSourceUrl,
	parseImportRuntime,
	transformImportTaskListResponse
} from './import-log-endpoints';

describe('buildImportRunSourceUrl', () => {
	it('builds a relative API URL without duplicating the configured root URL', () => {
		const run: ImportRunInput = {
			url: 'https://example.test/custom/import/source/2026/04/19/run-42/',
			range: {
				startDate: new Date(2026, 3, 19),
				endDate: new Date(2026, 3, 20)
			},
			force: true,
			project: 7
		};

		const result = buildImportRunSourceUrl(run);

		expect(result).toBe(
			'/api/v2/importruns/source/?url=https%3A%2F%2Fexample.test%2Fcustom%2Fimport%2Fsource%2F2026%2F04%2F19%2Frun-42%2F&from=2026-04-19&to=2026-04-20&force=true&project=7'
		);
	});
});

describe('parseImportRuntime', () => {
	it('parses HH:MM:SS.microseconds runtime strings as seconds', () => {
		expect(parseImportRuntime('00:00:01.355945')).toBe(1.355945);
	});

	it('parses runtime strings with minutes and hours', () => {
		expect(parseImportRuntime('00:01:02.5')).toBe(62.5);
		expect(parseImportRuntime('01:02:03')).toBe(3723);
	});

	it('keeps plain numeric strings as seconds', () => {
		expect(parseImportRuntime('1.25')).toBe(1.25);
	});

	it('returns null for missing, empty, or invalid runtime values', () => {
		expect(parseImportRuntime(null)).toBeNull();
		expect(parseImportRuntime('')).toBeNull();
		expect(parseImportRuntime('invalid')).toBeNull();
		expect(parseImportRuntime('00:00:invalid')).toBeNull();
	});
});

describe('transformImportTaskListResponse', () => {
	it('normalizes runtime strings from the import task list response', () => {
		const result = transformImportTaskListResponse({
			pagination: { count: 1 },
			results: [
				{
					status: 'SUCCESS',
					run_source_url: 'https://example.com/run',
					celery_task: 'task-1',
					started_at: null,
					finished_at: null,
					runtime: '00:00:01.355945',
					job_id: 1,
					run_id: null,
					event_logs: [],
					error_msg: null
				}
			]
		});

		expect(result.results[0].runtime).toBe(1.355945);
	});
});
