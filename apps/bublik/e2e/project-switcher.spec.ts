/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { test } from './support/test';

import { ConfigPage } from './pages/config-page';
import { ProjectPicker } from './pages/project-picker';
import { RunsPage } from './pages/runs-page';
import { projectIdByName } from './support/e2e-data';
import { and, but, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';

/** A name the fixtures never use, so no project matches it. */
const UNMATCHED_NAME = 'no-such-project-e2e';

test.describe('Project switcher', () => {
	// eslint-disable-next-line playwright/expect-expect
	test('Searching the project switcher narrows the list to one project', async ({
		page,
		request
	}) => {
		const runsPage = new RunsPage(page);
		const picker = new ProjectPicker(page);
		const names = [
			...new Set(requireManifest().bundles.map((bundle) => bundle.project))
		];
		const [searched, other] = requireCapability(
			names.length >= 2 ? [names[0], names[1]] : null,
			'Fixture manifest imports runs of fewer than two projects.'
		);
		let searchedId = 0;
		let otherId = 0;

		await given('two projects have runs imported', async () => {
			searchedId = requireCapability(
				await projectIdByName(request, searched),
				`Project "${searched}" is not registered.`
			);
			otherId = requireCapability(
				await projectIdByName(request, other),
				`Project "${other}" is not registered.`
			);
			await runsPage.goto();
		});
		await when(
			"I open the project switcher and search for the first project's name",
			() => picker.search(searched)
		);
		await then('that project is listed', () => picker.expectListed(searchedId));
		await but('the other project is not', () =>
			picker.expectNotListed(otherId)
		);
		await when('I search for a name no project has', () =>
			picker.search(UNMATCHED_NAME)
		);
		await then('the switcher says no project matches', () =>
			picker.expectNoMatch(UNMATCHED_NAME)
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test('Pressing P opens the project switcher', async ({ page }) => {
		const runsPage = new RunsPage(page);
		const picker = new ProjectPicker(page);

		await given('I am on the runs page', async () => {
			await runsPage.goto();
			await picker.expectReady();
		});
		await when('I press P', () => picker.openWithHotkey());
		await then('the project switcher is open with its search focused', () =>
			picker.expectOpen()
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The project switcher takes an admin to the project configs',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const configPage = new ConfigPage(page);
			const picker = new ProjectPicker(page);

			await given('I am signed in as an admin on the runs page', () =>
				runsPage.goto()
			);
			await when('I open the project switcher', () => picker.open());
			await then('it offers New Project and Manage', () =>
				picker.expectActions()
			);
			await when('I choose Manage', () => picker.manage());
			await then('the configs page is open', () => configPage.expectOpen());
			await and('the project switcher is closed', () => picker.expectClosed());
		}
	);

	test.describe('signed out', () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		// eslint-disable-next-line playwright/expect-expect
		test('The project switcher has no project actions when signed out', async ({
			page
		}) => {
			const runsPage = new RunsPage(page);
			const picker = new ProjectPicker(page);

			await given('I am signed out on the runs page', () => runsPage.goto());
			await when('I open the project switcher', () => picker.open());
			await then('it offers neither New Project nor Manage', () =>
				picker.expectNoActions()
			);
		});
	});
});
