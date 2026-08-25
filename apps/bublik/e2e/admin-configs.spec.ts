/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext } from '@playwright/test';

import { ConfigPage } from './pages/config-page';
import { and, given, then, when } from './support/gherkin';
import { urlParams } from './support/url-params';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';

interface ConfigListItem {
	id: number;
	name: string;
}

async function firstConfig(
	request: APIRequestContext
): Promise<ConfigListItem> {
	const response = await request.get('/api/v2/config/');
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as
		| ConfigListItem[]
		| { results?: ConfigListItem[] };
	const configs = Array.isArray(payload) ? payload : payload.results ?? [];

	return requireCapability(
		configs[0],
		'Instance has no configuration to open.'
	);
}

test.describe('Configuration Page', () => {
	test(
		'The configuration page lists the fixture projects',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const configPage = new ConfigPage(page);
			const projects = [
				...new Set(requireManifest().bundles.map((bundle) => bundle.project))
			];

			await when('I open the configuration page', () => configPage.goto());
			await then(
				'every project from the fixture manifest is listed',
				async () => {
					for (const project of projects) {
						await configPage.expectProjectListed(project);
					}
				}
			);
		}
	);

	test(
		'Opening a configuration shows its JSON in the editor',
		{ tag: ['@admin', '@url-params'] },
		async ({ page, request }) => {
			const configPage = new ConfigPage(page);
			let config = { id: 0, name: '' };

			await given('the API reports a configuration', async () => {
				config = await firstConfig(request);
			});
			await when('I open that configuration', () =>
				configPage.gotoConfig(config.id)
			);
			await then('the editor shows its content', () =>
				configPage.expectEditorReady()
			);
		}
	);

	test(
		'The editor can show the schema the configuration is validated against',
		{ tag: ['@admin'] },
		async ({ page, request }) => {
			const configPage = new ConfigPage(page);

			await given('I open a configuration', async () => {
				const config = await firstConfig(request);
				await configPage.gotoConfig(config.id);
				await configPage.expectEditorReady();
			});
			await when('I open the schema view', () => configPage.openSchema());
			await then('the schema is shown', () => configPage.expectSchemaVisible());
		}
	);

	test(
		'A malformed new configuration link falls back to the default editor',
		{ tag: ['@admin', '@url-params'] },
		async ({ page }) => {
			const configPage = new ConfigPage(page);
			const malformed = '{not-json';

			await given(
				'a link whose new configuration parameter is not valid JSON',
				() => expect(() => JSON.parse(malformed)).toThrow()
			);
			await when('I open that link', () =>
				page.goto(`admin/config?new_config=${encodeURIComponent(malformed)}`)
			);
			await then('the configuration page is ready', () =>
				expect(configPage.newProjectButton).toBeVisible({ timeout: 30_000 })
			);
			await and('the link still carries the malformed parameter', () =>
				urlParams(page).expect({ new_config: malformed })
			);
		}
	);
});
