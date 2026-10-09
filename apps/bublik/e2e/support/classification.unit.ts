/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
// Run with `pnpm run e2e:unit`. Named `.unit.ts` so Playwright never collects it.
/* eslint-disable playwright/expect-expect -- node:assert, not Playwright's expect */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { IssueCleanup } from './classification.ts';

function cleanupIn(scope: string, project: string): IssueCleanup {
	return new IssueCleanup(scope, () => project);
}

describe('IssueCleanup', () => {
	test('titles carry the scope and the browser project', () => {
		const title = cleanupIn('run', 'firefox').title('stamp');

		assert.match(title, /^e2e issue run firefox stamp \S+$/);
	});

	test("a sweep in one browser project leaves another project's issues alone", () => {
		const chromium = cleanupIn('run', 'chromium');
		const webkit = cleanupIn('run', 'webkit');

		assert.equal(chromium.owns(chromium.title('stamp')), true);
		assert.equal(chromium.owns(webkit.title('stamp')), false);
	});

	test('a sweep leaves the issues of a scope that merely starts the same way', () => {
		const issue = cleanupIn('issue', 'chromium');
		const issues = cleanupIn('issues', 'chromium');

		assert.equal(issue.owns(issues.title('facts')), false);
	});
});
