/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext } from '@playwright/test';

import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import {
	seededClassification,
	type SeededIssue
} from './support/seeded-classification';

/**
 * Both scenarios send a seeded issue's data at the server in a request it
 * refuses, so they leave it as they found it; `@issues-write` arms the sweep
 * under the one that would otherwise record an issue of its own.
 */
const ERRORS = { tag: ['@issues', '@needs-classification'] };
const ERRORS_WRITE = {
	tag: ['@issues', '@issues-write', '@needs-classification']
};

/** An open seeded issue, with a key and classified results, in the basic fixture's project. */
const KEYED_ISSUE = 'basic-latency-high';

const cleanup = new IssueCleanup('issue-errors');

function keyedIssue(): SeededIssue & { key: string } {
	const issue = seededClassification(requireManifest()).issue(KEYED_ISSUE);
	requireCapability(
		issue.rules.some((rule) => rule.classifiedResultIds.length > 0),
		`seeded issue "${KEYED_ISSUE}" classifies no result`
	);

	return {
		...issue,
		key: requireCapability(
			issue.key,
			`seeded issue "${KEYED_ISSUE}" has no key`
		)
	};
}

/** `ref://TRACKER/KEY` → its tracker and its key. */
function splitKey(ref: string): { tracker: string; key: string } {
	const match = requireCapability(
		/^ref:\/\/([^/]+)\/(.+)$/.exec(ref),
		`"${ref}" is not a ref:// bug key`
	);

	return { tracker: match[1], key: match[2] };
}

interface IssueRecord {
	title: string;
	description: string | null;
	bug_key: string | null;
	updated_at: string;
}

async function issueRecord(
	request: APIRequestContext,
	issue: SeededIssue
): Promise<IssueRecord> {
	const response = await request.get(
		`/api/v2/issues/${issue.issueId}/?project=${issue.projectId}`
	);
	expect(response.ok()).toBe(true);
	const { title, description, bug_key, updated_at } =
		(await response.json()) as IssueRecord;

	return { title, description, bug_key, updated_at };
}

test.describe('Issue server errors', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'Changing the bug key of an issue with results is refused on the Bug Key field',
		ERRORS,
		async ({ page, request }) => {
			const issuePage = new IssuePage(page);
			const issue = keyedIssue();
			const { key } = splitKey(issue.key);
			let before!: IssueRecord;

			await given(
				'a seeded issue that has classified results is open on its page',
				async () => {
					before = await issueRecord(request, issue);
					await issuePage.goto(issue.issueId);
					await issuePage.expectLoaded(issue.title);
				}
			);
			const drawer = await when(
				'I edit it, change only its bug key and save',
				async () => {
					const opened = await issuePage.openEdit();
					await opened.expectValues({ bugKey: key });
					await opened.fill({
						bugKey: `E2E-${Date.now().toString(36)}`
					});
					await opened.submit();

					return opened;
				}
			);
			await then("the Bug Key field shows the server's refusal", () =>
				drawer.expectValidation(
					'Cannot change the bug key on an issue that already has classified results.'
				)
			);
			await when('I cancel the edit', () => drawer.cancel());
			await then('the issue still shows its key', () =>
				expect(issuePage.fact('Key')).toHaveText(key)
			);
			await and('the server recorded no change to it', async () => {
				expect(await issueRecord(request, issue)).toEqual(before);
			});
		}
	);

	test(
		'Recording an issue under a bug key the project already uses is refused',
		ERRORS_WRITE,
		async ({ page, request }) => {
			const issuesPage = new IssuesPage(page);
			const issue = keyedIssue();
			const { tracker, key } = splitKey(issue.key);
			const title = cleanup.title('duplicate key');
			let before!: IssueRecord;

			await given(
				"I open the issues page for a seeded issue's project",
				async () => {
					before = await issueRecord(request, issue);
					await issuesPage.goto({ project: String(issue.projectId) });
					await issuesPage.expectLoaded();
				}
			);
			const drawer = await when(
				"I record a new issue under that issue's tracker and key",
				async () => {
					const opened = await issuesPage.openNewIssue();
					await opened.fill({ title, tracker, bugKey: key });
					await opened.submit();

					return opened;
				}
			);
			await then('the drawer shows that the key is already taken', () =>
				drawer.expectFormError(/bug_key must make a unique set/)
			);
			await when('I cancel the new issue', () => drawer.cancel());
			await then('no issue was recorded under my title', async () => {
				await issuesPage.table.search(title);
				await issuesPage.table.expectNoMatching();
			});
			await and('the seeded issue is unchanged', async () => {
				expect(await issueRecord(request, issue)).toEqual(before);
			});
		}
	);
});
