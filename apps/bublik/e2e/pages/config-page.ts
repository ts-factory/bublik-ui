/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class ConfigPage {
	constructor(private readonly page: Page) {}

	get newProjectButton(): Locator {
		return this.page.getByRole('button', { name: 'New Project' });
	}

	get newConfigButton(): Locator {
		return this.page.getByRole('button', { name: 'New Config' });
	}

	async goto(): Promise<void> {
		await this.page.goto('admin/config');
		await expect(this.newProjectButton).toBeVisible();
	}

	async ensureProjectExists(projectName: string): Promise<void> {
		await this.goto();

		if (await this.projectToggle(projectName).isVisible()) {
			return;
		}

		await this.newProjectButton.click();
		const dialog = this.page.getByRole('dialog');
		await dialog.getByLabel('Name').fill(projectName);
		await dialog.getByRole('button', { name: 'Create' }).click();
		await expect(dialog).toBeHidden({ timeout: 10_000 });
		await expect(this.projectToggle(projectName)).toBeVisible();
	}

	async ensureReferencesConfigExists(
		projectName: string,
		configContent: string
	): Promise<void> {
		await this.goto();

		const configMatches = await this.page.evaluate(
			async ({ projectName: name, configContent: content }) => {
				const [configsResponse, projectsResponse] = await Promise.all([
					fetch(`${window.location.origin}/api/v2/config/`, {
						credentials: 'include'
					}),
					fetch(`${window.location.origin}/api/v2/projects/`, {
						credentials: 'include'
					})
				]);
				const configs = await configsResponse.json();
				const projects = await projectsResponse.json();
				const project = projects.find(
					(item: { name: string }) => item.name === name
				);
				const expected = JSON.stringify(JSON.parse(content));

				return configs.some(
					(config: { name: string; project: number; content: unknown }) =>
						config.name === 'references' &&
						config.project === project?.id &&
						JSON.stringify(config.content) === expected
				);
			},
			{ projectName, configContent }
		);
		if (configMatches) return;

		await this.page.evaluate(async (name) => {
			const [configsResponse, projectsResponse] = await Promise.all([
				fetch(`${window.location.origin}/api/v2/config/`, {
					credentials: 'include'
				}),
				fetch(`${window.location.origin}/api/v2/projects/`, {
					credentials: 'include'
				})
			]);
			const configs = await configsResponse.json();
			const projects = await projectsResponse.json();
			const project = projects.find(
				(item: { name: string }) => item.name === name
			);

			await Promise.all(
				configs
					.filter(
						(config: { name: string; project: number }) =>
							config.name === 'references' && config.project === project?.id
					)
					.map((config: { id: number }) =>
						fetch(`${window.location.origin}/api/v2/config/${config.id}/`, {
							method: 'DELETE',
							credentials: 'include'
						})
					)
			);
		}, projectName);
		await this.goto();

		const projectCard = this.projectCard(projectName);

		const createReferencesButton = projectCard.getByRole('button', {
			name: /Create references/
		});

		if (await createReferencesButton.isVisible()) {
			await createReferencesButton.click();
		} else {
			await this.newConfigButton.click();
			await this.page.getByRole('menuitem', { name: /references/ }).click();
		}

		await expect(
			this.page.getByText('Create New Global Config', { exact: true })
		).toBeVisible();

		const editor = this.page.getByRole('textbox', { name: 'Editor content' });
		// eslint-disable-next-line playwright/no-force-option
		await editor.click({ force: true });
		await this.page.keyboard.press('ControlOrMeta+A');
		await this.page.keyboard.press('Backspace');
		await this.page.keyboard.insertText(configContent.slice(0, -1));
		await expect(this.page.getByText('Local Logs Base')).toBeVisible();

		const createButton = this.page
			.getByRole('button', { name: 'Create' })
			.first();
		await createButton.click();

		const dialog = this.page.getByRole('dialog');
		await expect(
			dialog.getByRole('heading', { name: 'New Config' })
		).toBeVisible();
		await dialog.locator('select').selectOption({ label: projectName });
		await dialog.getByRole('button', { name: 'Create' }).click();
		await expect(dialog).toBeHidden({ timeout: 10_000 });
		await expect(projectCard.getByText(/references #\d+/)).toBeVisible({
			timeout: 15_000
		});
	}

	async ensureReportConfigExists(
		projectName: string,
		configName: string,
		configContent: string
	): Promise<void> {
		await this.goto();

		const configMatches = await this.page.evaluate(
			async ({
				projectName: name,
				configName: cfgName,
				configContent: content
			}) => {
				const [configsResponse, projectsResponse] = await Promise.all([
					fetch(`${window.location.origin}/api/v2/config/`, {
						credentials: 'include'
					}),
					fetch(`${window.location.origin}/api/v2/projects/`, {
						credentials: 'include'
					})
				]);
				const configs = await configsResponse.json();
				const projects = await projectsResponse.json();
				const project = projects.find(
					(item: { name: string }) => item.name === name
				);
				const expected = JSON.stringify(JSON.parse(content));

				return configs.some(
					(config: {
						name: string;
						type: string;
						project: number;
						content: unknown;
					}) =>
						config.name === cfgName &&
						config.type === 'report' &&
						config.project === project?.id &&
						JSON.stringify(config.content) === expected
				);
			},
			{ projectName, configName, configContent }
		);
		if (configMatches) return;

		await this.page.evaluate(
			async ({ projectName: name, configName: cfgName }) => {
				const [configsResponse, projectsResponse] = await Promise.all([
					fetch(`${window.location.origin}/api/v2/config/`, {
						credentials: 'include'
					}),
					fetch(`${window.location.origin}/api/v2/projects/`, {
						credentials: 'include'
					})
				]);
				const configs = await configsResponse.json();
				const projects = await projectsResponse.json();
				const project = projects.find(
					(item: { name: string }) => item.name === name
				);

				await Promise.all(
					configs
						.filter(
							(config: { name: string; type: string; project: number }) =>
								config.name === cfgName &&
								config.type === 'report' &&
								config.project === project?.id
						)
						.map((config: { id: number }) =>
							fetch(`${window.location.origin}/api/v2/config/${config.id}/`, {
								method: 'DELETE',
								credentials: 'include'
							})
						)
				);
			},
			{ projectName, configName }
		);
		await this.goto();

		const projectCard = this.projectCard(projectName);

		await this.newConfigButton.click();
		await this.page.getByRole('menuitem', { name: /^report$/ }).click();

		await expect(
			this.page.getByText('Create New Report Config', { exact: true })
		).toBeVisible();

		const editor = this.page.getByRole('textbox', { name: 'Editor content' });
		// eslint-disable-next-line playwright/no-force-option
		await editor.click({ force: true });
		await this.page.keyboard.press('ControlOrMeta+A');
		await this.page.keyboard.press('Backspace');
		await this.page.keyboard.insertText(configContent.slice(0, -1));

		const createButton = this.page
			.getByRole('button', { name: 'Create' })
			.first();
		await createButton.click();

		const dialog = this.page.getByRole('dialog');
		await expect(
			dialog.getByRole('heading', { name: 'New Config' })
		).toBeVisible();
		await dialog.locator('select').selectOption({ label: projectName });
		await dialog.getByLabel('Name').fill(configName);
		await dialog.getByRole('button', { name: 'Create' }).click();
		await expect(dialog).toBeHidden({ timeout: 10_000 });
		await expect(
			projectCard.getByText(new RegExp(`${escapeRegExp(configName)} #\\d+`))
		).toBeVisible({ timeout: 15_000 });
	}

	private projectToggle(projectName: string): Locator {
		return this.projectCard(projectName).getByRole('button', {
			name: new RegExp(`^${escapeRegExp(projectName)}$`)
		});
	}

	private projectCard(projectName: string): Locator {
		return this.page.locator('div.grid.border-border-primary').filter({
			has: this.page.getByRole('button', {
				name: new RegExp(`^${escapeRegExp(projectName)}$`)
			})
		});
	}
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { ConfigPage };
