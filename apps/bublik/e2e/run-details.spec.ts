/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/run-details.feature */
import { expect, test } from '@playwright/test';

import { LogPage } from './pages/log-page';
import { RunPage } from './pages/run-page';
import {
	importedRunId,
	reportConfiguredImportedRun,
	representativeImportedRun
} from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import { representativeNokRun } from './support/sample-cases';

function nokRun() {
	const representative = requireCapability(
		representativeNokRun(requireManifest()),
		'Fixture manifest contains no NOK samples.'
	);

	return { ...representative, runId: importedRunId(representative.bundle) };
}

test.describe('Run Details Page', () => {
	// Assertions are encapsulated by RunPage.
	// eslint-disable-next-line playwright/expect-expect
	test(
		'Run details show the metadata recorded in the manifest',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(requireManifest());

			await given('the fixture manifest describes an imported run', () =>
				expect(runId).toBeGreaterThan(0)
			);
			await when("I open that run's page", async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await then('the info card shows the run id', () =>
				runPage.expectDetail('Run ID', String(runId))
			);
			await and('the info card shows the conclusion', () =>
				runPage.expectDetail('Conclusion')
			);
		}
	);

	// Assertions are encapsulated by RunPage.
	// eslint-disable-next-line playwright/expect-expect
	test('Exposing the run info reveals the full detail set', async ({ page }) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when('I expose the full run info', () => runPage.toggleFullMode());
		await then('the info card also shows the run status and duration', async () => {
			await runPage.expectDetail('Status');
			await runPage.expectDetail('Duration');
		});
	});

	test('Expanding a package reveals the tests it contains', async ({ page }) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());
		let rowsBefore = 0;

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
			rowsBefore = await runPage.rows().count();
		});
		await when('I expand the first collapsed package of the tree', async () => {
			const collapsed = runPage.packageRows({ expanded: false }).first();
			await expect(collapsed).toBeVisible({ timeout: 30_000 });
			await runPage.toggleTreeNode(collapsed);
		});
		await then('more rows are shown than before', () =>
			runPage.expectRowCountAbove(rowsBefore)
		);
	});

	// Assertions are encapsulated by RunPage.
	// eslint-disable-next-line playwright/expect-expect
	test(
		'Open NOK expands the result tables of the unexpected results',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = nokRun();

			await given('I open a run that has unexpected results', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I press Open NOK', () => runPage.openNok());
			await then('at least one result table is expanded', () =>
				runPage.expectResultTableVisible()
			);
			await when('I press Reset', () => runPage.resetTable());
			await then('no result table is expanded', () =>
				runPage.expectNoResultTable()
			);
		}
	);

	test(
		'Preview NOK expands the tree without opening result tables',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given('I open a run that has unexpected results', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I press Preview NOK', () => runPage.previewNok());
			await then('the tests with unexpected results are listed', async () => {
				for (const sampleName of sampleNames) {
					await expect(page.getByText(sampleName).first()).toBeVisible({
						timeout: 15_000
					});
				}
			});
			await and('no result table is expanded', () =>
				runPage.expectNoResultTable()
			);
		}
	);

	test("Clicking a count badge opens that test's result table", async ({
		page
	}) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());
		let testName = '';

		let testRow = page.locator('never');

		await given(
			"I open an imported run's page and expand the tree down to a test",
			async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				testRow = await runPage.expandUntilTestRow();
				testName = (await testRow.getAttribute('data-test-name')) ?? '';
			}
		);
		await when('I click the total count badge of that test row', () =>
			runPage.firstCountBadge(testRow).click()
		);
		await then("that test's result table is expanded", () =>
			expect(runPage.resultTable(testName)).toBeVisible({ timeout: 30_000 })
		);
	});

	test('The run header opens the log of the whole run', async ({ page }) => {
		const runPage = new RunPage(page);
		const logPage = new LogPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when("I follow the header's Log link", () =>
			page.getByRole('banner').getByRole('link', { name: /^Log$/ }).click()
		);
		await then('the log page for that run is open', async () => {
			await expect(page).toHaveURL(new RegExp(`/log/${runId}`));
			await logPage.expectLoaded();
		});
	});

	test('A result row links to the log of that result', async ({ page }) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given(
			"I open an imported run's page with a result table expanded",
			async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);

				const testRow = await runPage.expandUntilTestRow();
				await runPage.firstCountBadge(testRow).click();
				await runPage.expectResultTableVisible();
			}
		);
		await when("I follow the result's Log link", () =>
			runPage
				.resultTables()
				.first()
				.getByRole('link', { name: 'Log', exact: true })
				.first()
				.click()
		);
		await then('the log page opens focused on that result', () =>
			expect(page).toHaveURL(new RegExp(`/log/${runId}.*focusId=\\d+`), {
				timeout: 15_000
			})
		);
	});

	test('The compare form rejects a value that is not a run', async ({ page }) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when(
			'I open the compare form and submit an invalid run reference',
			async () => {
				const form = await runPage.openCompareForm();
				await form.getByLabel('Right Run').fill('not-a-run');
				await form.getByRole('button', { name: 'Compare' }).click();
			}
		);
		await then(
			'the form reports that the value is not a valid URL or run id',
			() =>
				expect(page.getByText(/Must be a valid URL/).first()).toBeVisible({
					timeout: 15_000
				})
		);
	});

	test(
		'The reports menu lists the configured report',
		{ tag: ['@needs-report'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const manifest = requireManifest();
			const { expectedRun, runId } = reportConfiguredImportedRun(manifest);
			const configName = requireCapability(
				manifest.configs.find((config) => config.type === 'report')?.name,
				'Fixture manifest contains no report config.'
			);

			await given('I open a run whose project has a report config', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I open the reports menu', () => runPage.openReports());
			await then('the configured report is offered', () =>
				expect(page.getByRole('menuitem', { name: configName })).toBeVisible({
					timeout: 15_000
				})
			);
		}
	);
});
