/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, test } from './support/test';

import { McpServersSettings } from './pages/mcp-servers-page';
import { and, given, then, when } from './support/gherkin';

/** Unique per run so repeat runs never collide on the per-user name rule. */
const serverName = (label: string) => `e2e-${label}-${Date.now()}`;

/** A URL on a host the administrator allowed; the scenarios need one. */
const SERVER_URL = process.env['E2E_MCP_SERVER_URL'] ?? '';
const SECRET = `Bearer e2e-secret-${Date.now()}`;

test.describe('MCP servers', () => {
	test.beforeEach(async ({ page, baseURL }) => {
		const features = await page.request.get(
			new URL('api/v2/server/features/', baseURL).toString()
		);
		const { user_mcp_servers_enabled } = await features.json();

		test.skip(
			!user_mcp_servers_enabled || !SERVER_URL,
			'needs user_mcp_servers allowed in the AI config and E2E_MCP_SERVER_URL'
		);
	});

	test(
		'Adding an MCP server lists it without showing its header value',
		{ tag: ['@mcp-servers'] },
		async ({ page }) => {
			const settings = new McpServersSettings(page);
			const name = serverName('add');

			await given('I open the MCP servers settings', () => settings.goto());
			await when('I add a server with an Authorization header', () =>
				settings.addServer({
					name,
					url: SERVER_URL,
					headers: [['Authorization', SECRET]]
				})
			);
			await then("the server is listed with the header's name", () =>
				expect(settings.headerChip(name, 'Authorization')).toBeVisible()
			);
			await and("the header's value appears nowhere on the page", () =>
				expect(page.getByText(SECRET)).toHaveCount(0)
			);

			await settings.remove(name, true);
		}
	);

	test(
		'Editing an MCP server keeps a header whose value is left blank',
		{ tag: ['@mcp-servers'] },
		async ({ page }) => {
			const settings = new McpServersSettings(page);
			const name = serverName('edit');
			const newName = `${name}-renamed`;

			await given('I open the MCP servers settings', () => settings.goto());
			await and('I have a server with an Authorization header', () =>
				settings.addServer({
					name,
					url: SERVER_URL,
					headers: [['Authorization', SECRET]]
				})
			);
			await when('I rename it and leave the header value blank', () =>
				settings.rename(name, newName)
			);
			await then(
				'the server is listed under its new name with the header still present',
				async () => {
					await expect(settings.row(newName)).toBeVisible({ timeout: 15_000 });
					await expect(
						settings.headerChip(newName, 'Authorization')
					).toBeVisible();
				}
			);

			await settings.remove(newName, true);
		}
	);

	test(
		'The MCP server form refuses a non-http URL',
		{ tag: ['@mcp-servers'] },
		async ({ page }) => {
			const settings = new McpServersSettings(page);

			await given('I open the MCP servers settings', () => settings.goto());
			await and('I open the new-server form', () => settings.openCreateForm());
			await when('I submit it with a URL that has no http scheme', () =>
				settings.submitCreateForm({
					name: serverName('bad-url'),
					url: 'mcp.example.com/mcp'
				})
			);
			await then('the form reports that the URL must be http or https', () =>
				expect(
					settings.createDialog.getByText(
						'URL must start with http:// or https://'
					)
				).toBeVisible({ timeout: 15_000 })
			);
			await when('I close the new-server form', () =>
				settings.closeCreateForm()
			);
			await then('no server was added', () =>
				expect(settings.row('bad-url')).toHaveCount(0)
			);
		}
	);

	test(
		'Deleting an MCP server asks for confirmation and can be cancelled',
		{ tag: ['@mcp-servers'] },
		async ({ page }) => {
			const settings = new McpServersSettings(page);
			const name = serverName('delete');

			await given('I open the MCP servers settings', () => settings.goto());
			await and('I have a server to delete', () =>
				settings.addServer({ name, url: SERVER_URL })
			);
			await when('I ask to delete it and cancel the confirmation', () =>
				settings.remove(name, false)
			);
			await then('the server is still listed', () =>
				expect(settings.row(name)).toBeVisible()
			);
			await when('I ask to delete it and confirm', () =>
				settings.remove(name, true)
			);
			await then('the server is gone from the list', () =>
				expect(settings.row(name)).toHaveCount(0, { timeout: 15_000 })
			);
		}
	);
});
