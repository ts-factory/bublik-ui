/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { docsUrl, USER_GUIDE } from './docs';
import { config } from './environment';

describe('docsUrl', () => {
	it('links to the docs root without a path', () => {
		expect(docsUrl()).toBe(`${config.oldBaseUrl}/docs`);
	});

	it('links to a page and section of the docs', () => {
		expect(docsUrl(USER_GUIDE.runsCharts)).toBe(
			`${config.oldBaseUrl}/docs/user-guide/runs#charts`
		);
	});
});
