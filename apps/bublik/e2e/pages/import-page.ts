/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

interface ScheduledImportTask {
	jobId: number;
	runSourceUrl: string;
}

interface ImportTaskRow {
	status: string;
	run_source_url: string;
	run_id: number | null;
}

interface ImportTaskListResponse {
	pagination?: {
		count?: number;
	};
	results?: ImportTaskRow[];
}

class ImportPage {
	readonly importButton: Locator;

	constructor(private readonly page: Page) {
		this.importButton = page.getByRole('button', { name: 'Import' });
	}

	get importModal(): Locator {
		return this.page.locator('[role="dialog"]');
	}

	get submitButton(): Locator {
		return this.importModal.getByRole('button', {
			name: /^(Import|Creating import jobs)/
		});
	}

	get urlInputs(): Locator {
		return this.importModal.locator('input[placeholder*="ts-factory.io"]');
	}

	get addUrlButton(): Locator {
		return this.importModal.getByRole('button', { name: /^Add$/ });
	}

	get forceImportCheckbox(): Locator {
		return this.importModal.getByRole('checkbox', {
			name: 'Force import for all runs'
		});
	}

	get importResultTasks(): Locator {
		return this.importModal.getByTestId('import-result-task');
	}

	get importFilterUrlInput(): Locator {
		return this.page.getByRole('textbox', { name: 'URL' });
	}

	get importFilterSubmitButton(): Locator {
		return this.page.getByRole('button', { name: 'Submit' });
	}

	get importEventStatuses(): Locator {
		return this.page.getByTestId('import-event-status');
	}

	get importEventEmptyState(): Locator {
		return this.page.getByText('No results found', { exact: true });
	}

	async goto(): Promise<void> {
		await this.page.goto('admin/import');
		await expect(this.importButton).toBeVisible();
	}

	async openImportForm(): Promise<void> {
		await this.importButton.click();
		await expect(this.importModal).toBeVisible();
	}

	async fillUrl(index: number, url: string): Promise<void> {
		await this.urlInputs.nth(index).fill(url);
	}

	async fillUrls(urls: string[]): Promise<void> {
		while ((await this.urlInputs.count()) < urls.length) {
			await this.addUrlButton.click();
		}

		for (const [index, url] of urls.entries()) {
			await this.fillUrl(index, url);
		}
	}

	async enableForceImport(): Promise<void> {
		await this.forceImportCheckbox.check();
	}

	async selectProject(projectName: string): Promise<void> {
		await this.importModal.getByRole('combobox').click();
		await this.page.getByRole('option', { name: projectName }).click();
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
		await expect(
			this.importModal.getByText(
				'Scheduled runs will be imported in the background'
			)
		).toBeVisible({ timeout: 60_000 });
	}

	async scheduleImport(
		importUrl: string,
		projectName?: string
	): Promise<ScheduledImportTask[]> {
		return this.scheduleImports([importUrl], projectName);
	}

	async scheduleImports(
		importUrls: string[],
		projectName?: string
	): Promise<ScheduledImportTask[]> {
		await this.goto();
		await this.openImportForm();
		if (projectName) await this.selectProject(projectName);
		await this.fillUrls(importUrls);
		await this.submit();

		const tasks = await this.collectScheduledImportTasks();
		await this.closeResultModal();
		return tasks;
	}

	async collectScheduledImportTasks(): Promise<ScheduledImportTask[]> {
		await this.importResultTasks
			.first()
			.waitFor({ state: 'visible', timeout: 30_000 });

		const count = await this.importResultTasks.count();
		const tasks: ScheduledImportTask[] = [];

		for (let index = 0; index < count; index++) {
			const task = this.importResultTasks.nth(index);
			const jobId = Number(await task.getAttribute('data-job-id'));
			const runSourceUrl =
				(await task.getAttribute('data-run-source-url')) ?? '';

			if (Number.isFinite(jobId) && jobId > 0 && runSourceUrl) {
				tasks.push({ jobId, runSourceUrl });
			}
		}

		return tasks;
	}

	async getImportTasksByJob(jobId: number): Promise<ImportTaskRow[]> {
		return this.page.evaluate(async (id) => {
			const response = await fetch(
				`${window.location.origin}/api/v2/session_import/${id}/`,
				{ credentials: 'include', cache: 'no-cache' }
			);

			if (response.status === 404) return [];
			if (!response.ok) {
				throw new Error(`Failed to load import job ${id}: ${response.status}`);
			}
			return response.json();
		}, jobId);
	}

	async getImportTasksByUrl(runSourceUrl: string): Promise<ImportTaskRow[]> {
		const response = await this.page.request.get('/api/v2/session_import/', {
			params: { url: runSourceUrl, page_size: 10000 }
		});

		if (!response.ok()) return [];

		const payload = (await response.json()) as ImportTaskListResponse;

		return payload.results ?? [];
	}

	async getImportTasksPage(page: number): Promise<ImportTaskListResponse> {
		const response = await this.page.request.get('/api/v2/session_import/', {
			params: { page, page_size: 10000 }
		});

		if (!response.ok()) return { pagination: { count: 0 }, results: [] };

		return (await response.json()) as ImportTaskListResponse;
	}

	async getAllImportTasks(): Promise<ImportTaskRow[]> {
		const tasks: ImportTaskRow[] = [];
		let page = 1;
		let count = Number.POSITIVE_INFINITY;

		while (tasks.length < count) {
			const payload = await this.getImportTasksPage(page);
			const results = payload.results ?? [];
			count = payload.pagination?.count ?? results.length;

			if (!results.length) break;

			tasks.push(...results);
			page += 1;
		}

		return tasks;
	}

	async findImportedRunIdsByUrls(
		runSourceUrls: string[]
	): Promise<Map<string, number>> {
		const expectedUrls = new Set(runSourceUrls.map(normalizeUrl));
		const runIdsByUrl = new Map<string, number>();

		for (const task of await this.getAllImportTasks()) {
			const normalizedUrl = normalizeUrl(task.run_source_url);
			const runId = getImportedRunId(task);

			if (
				expectedUrls.has(normalizedUrl) &&
				runId !== null &&
				!runIdsByUrl.has(normalizedUrl)
			) {
				runIdsByUrl.set(normalizedUrl, runId);
			}
		}

		return runIdsByUrl;
	}

	async findSuccessfulRunIdByUrl(runSourceUrl: string): Promise<number> {
		const expectedUrl = normalizeUrl(runSourceUrl);

		for (const task of await this.getImportTasksByUrl(runSourceUrl)) {
			const runId = getImportedRunId(task);

			if (normalizeUrl(task.run_source_url) === expectedUrl && runId !== null) {
				return runId;
			}
		}

		return 0;
	}

	async filterImportEventsByUrl(runSourceUrl: string): Promise<void> {
		await this.goto();
		await this.importFilterUrlInput.fill(runSourceUrl);

		const responsePromise = this.page.waitForResponse(
			(response) => {
				try {
					const url = new URL(response.url());
					return (
						url.pathname.includes('/api/v2/session_import') &&
						url.searchParams.get('url') === runSourceUrl
					);
				} catch {
					return false;
				}
			},
			{ timeout: 30_000 }
		);

		await this.importFilterSubmitButton.click();
		await responsePromise;

		await expect
			.poll(
				async () => {
					if (await this.importEventEmptyState.isVisible()) {
						return true;
					}

					const count = await this.importEventStatuses.count();
					for (let index = 0; index < count; index++) {
						const sourceUrl =
							(await this.importEventStatuses
								.nth(index)
								.getAttribute('data-run-source-url')) ?? '';
						if (normalizeUrl(sourceUrl) === normalizeUrl(runSourceUrl)) {
							return true;
						}
					}

					return false;
				},
				{
					timeout: 30_000,
					intervals: [500, 1000, 2000],
					message: `Timed out waiting for import events filtered by ${runSourceUrl}`
				}
			)
			.toBe(true);
	}

	async waitForSuccessfulJob(
		jobId: number,
		expectedUrls: string[]
	): Promise<ImportTaskRow[]> {
		const expected = new Set(expectedUrls.map(normalizeUrl));
		let lastTasks: ImportTaskRow[] = [];

		await expect
			.poll(
				async () => {
					lastTasks = await this.getImportTasksByJob(jobId);
					const failed = lastTasks.some(
						(task) =>
							task.status.toUpperCase() === 'FAILURE' &&
							getImportedRunId(task) === null
					);
					if (failed) {
						throw new Error(
							`Import job ${jobId} failed: ${JSON.stringify(lastTasks)}`
						);
					}

					const completed = new Set(
						lastTasks
							.filter((task) => getImportedRunId(task) !== null)
							.map((task) => normalizeUrl(task.run_source_url))
					);
					return [...expected].every((url) => completed.has(url));
				},
				{
					timeout: 600_000,
					intervals: [1000, 2000, 5000],
					message: `Timed out waiting for import job ${jobId}`
				}
			)
			.toBe(true);

		return lastTasks;
	}

	async closeResultModal(): Promise<void> {
		const closeButton = this.importModal.locator(
			'button[class*="absolute top-4"]'
		);
		await closeButton.click();
		await this.importModal
			.waitFor({ state: 'hidden', timeout: 5_000 })
			.catch(() => {
				// Import completion polling reloads the page, so a still-open result modal is harmless.
			});
	}
}

function getImportedRunId(task: ImportTaskRow): number | null {
	const runId = Number(task.run_id);

	return Number.isFinite(runId) && runId > 0 ? runId : null;
}

function normalizeUrl(value: string): string {
	try {
		const url = new URL(value);
		return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
	} catch {
		return value.replace(/\/+$/, '');
	}
}

export { ImportPage, normalizeUrl };
export type { ImportTaskRow, ScheduledImportTask };
