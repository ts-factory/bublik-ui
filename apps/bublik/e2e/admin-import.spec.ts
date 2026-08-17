/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/admin-import.feature */
import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import { ImportPage, normalizeUrl } from './pages/import-page';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';

/**
 * The URL exactly as the importer recorded it. The manifest's importUrl is the
 * same log without a trailing slash, and the API's ?url= filter is an exact
 * match, so the recorded value is the one to filter by.
 */
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
				// The form restores the rows of the previous import, so the
				// starting count is whatever the shared storage state carries.
				rowsBefore = await importPage.urlInputs.count();
			});
			await when('I add another URL row', () => importPage.addUrlButton.click());
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
});
