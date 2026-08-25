/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { APIRequestContext } from '@playwright/test';

import { ImportPage, normalizeUrl } from './pages/import-page';
import { given, then, when } from './support/gherkin';
import { urlParams } from './support/url-params';
import { requireCapability } from './support/capabilities';

async function recordedSourceUrl(request: APIRequestContext): Promise<string> {
	const response = await request.get(
		'/api/v2/session_import/?page=1&page_size=1'
	);
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as {
		results?: { run_source_url?: string }[];
	};

	return requireCapability(
		payload.results?.[0]?.run_source_url,
		'Instance has no recorded import events.'
	);
}

async function recordedTaskId(request: APIRequestContext): Promise<string> {
	const response = await request.get(
		'/api/v2/session_import/?page=1&page_size=20'
	);
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as {
		results?: { celery_task?: string | null }[];
	};

	return requireCapability(
		payload.results?.find((result) => result.celery_task)?.celery_task,
		'Instance has no import event carrying a celery task id.'
	);
}

test.describe('Import Page', () => {
	test(
		'The import page lists the events of the fixture imports',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const importPage = new ImportPage(page);

			await when('I open the import page', () => importPage.goto());
			await then('the import event log lists at least one event', () =>
				expect(importPage.importEventStatuses.first()).toBeVisible({
					timeout: 30_000
				})
			);
		}
	);

	test(
		'Filtering the event log by source URL narrows it to that import',
		{ tag: ['@admin'] },
		async ({ page, request }) => {
			const importPage = new ImportPage(page);
			let sourceUrl = '';

			await given('an import event was recorded for a source URL', async () => {
				sourceUrl = await recordedSourceUrl(request);
			});
			await when('I filter the import events by that URL', () =>
				importPage.filterImportEventsByUrl(sourceUrl)
			);
			await then('every listed event belongs to that URL', async () => {
				const statuses = importPage.importEventStatuses;
				await expect(statuses.first()).toBeVisible({ timeout: 30_000 });

				const urls = await statuses.evaluateAll((nodes) =>
					nodes.map((node) => node.getAttribute('data-run-source-url'))
				);

				expect(urls.length).toBeGreaterThan(0);
				for (const url of urls) {
					expect(normalizeUrl(url ?? '')).toBe(normalizeUrl(sourceUrl));
				}
			});
		}
	);

	test(
		'Filtering by a URL nothing was imported from reports no matching tasks',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const importPage = new ImportPage(page);

			await when(
				'I filter the import events by a URL no run was imported from',
				async () => {
					await importPage.goto();
					await importPage.importFilterUrlInput.fill(
						'https://example.invalid/never-imported'
					);
					await importPage.importFilterSubmitButton.click();
				}
			);
			await then('the page reports that no tasks match the parameters', () =>
				expect(importPage.importEventEmptyState).toBeVisible({
					timeout: 30_000
				})
			);
		}
	);

	test(
		'The import form collects several log URLs before submitting',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const importPage = new ImportPage(page);
			let rowsBefore = 0;

			await given('I open the import form', async () => {
				await importPage.goto();
				await importPage.openImportForm();
				rowsBefore = await importPage.urlInputs.count();
			});
			await when('I add another URL row', () =>
				importPage.addUrlButton.click()
			);
			await then('the form offers one more URL input than before', () =>
				expect(importPage.urlInputs).toHaveCount(rowsBefore + 1, {
					timeout: 15_000
				})
			);
			await when('I close the form without importing', () =>
				importPage.closeResultModal()
			);
			await then('the import form is gone', () =>
				expect(importPage.importModal).toBeHidden({ timeout: 15_000 })
			);
		}
	);

	test(
		"An import task link opens that task's log and closing it clears the URL",
		{ tag: ['@admin', '@url-params'] },
		async ({ page, request }) => {
			const url = urlParams(page);
			let taskId = '';

			await given(
				'a link that names a recorded import task and asks to follow it',
				async () => {
					taskId = await recordedTaskId(request);
				}
			);
			await when('I open that link', () =>
				page.goto(`admin/import?${new URLSearchParams({ taskId, poll: '1' })}`)
			);
			await then('the import task log is open', () =>
				expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 })
			);
			await when('I close the log', async () => {
				await page.keyboard.press('Escape');
				await expect(page.getByRole('dialog')).toHaveCount(0, {
					timeout: 15_000
				});
			});
			await then(
				'the task and the polling flag are both dropped from the URL',
				() => url.expect({ taskId: null, poll: null })
			);
		}
	);
});
