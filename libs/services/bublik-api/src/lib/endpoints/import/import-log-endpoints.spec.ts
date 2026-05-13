/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ImportRunInput } from '@/shared/types';

import { buildImportRunSourceUrl } from './import-log-endpoints';

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
