/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';
import type { APIResponse, Response } from '@playwright/test';

import {
	selectReusableSuccessfulTask,
	successfulImportedRunId
} from '../support/import-task-state';
import type { ImportTaskRow } from '../support/import-task-state';

interface ScheduledImportTask {
	jobId: number;
	runSourceUrl: string;
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
		return this.page.getByText(
			"Tasks corresponding to the passed parameters doesn't exist"
		);
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

	async submit(expectedRequestCount = 1): Promise<void> {
		const responses: Response[] = [];
		const collectImportResponse = (response: Response): void => {
			if (
				new URL(response.url()).pathname.endsWith('/api/v2/importruns/source/')
			) {
				responses.push(response);
			}
		};
		this.page.on('response', collectImportResponse);

		try {
			await this.submitButton.click();
			await expect
				.poll(() => responses.length, {
					timeout: 60_000,
					message: `Expected ${expectedRequestCount} import API responses, received ${responses.length}`
				})
				.toBeGreaterThanOrEqual(expectedRequestCount);
		} finally {
			this.page.off('response', collectImportResponse);
		}

		const failedResponses = responses.filter((response) => !response.ok());
		if (failedResponses.length) {
			const failures = await Promise.all(
				failedResponses.map(async (response) => {
					await response.finished();
					const body = await response
						.text()
						.catch(() => '<unreadable response>');
					return `${response.status()} ${response.url()}: ${body}`;
				})
			);
			throw new Error(`Import API request failed:\n${failures.join('\n')}`);
		}

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
		await this.submit(importUrls.length);

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

			if (!Number.isFinite(jobId) || jobId <= 0 || !runSourceUrl) {
				throw new Error(
					`Import result task ${index} is missing data-job-id or data-run-source-url.`
				);
			}

			tasks.push({ jobId, runSourceUrl });
		}

		return tasks;
	}

	async getImportTasksByJob(jobId: number): Promise<ImportTaskRow[]> {
		const response = await this.page.request.get(
			`/api/v2/session_import/${jobId}/`
		);
		await assertApiResponse(response, `load import job ${jobId}`);

		return response.json() as Promise<ImportTaskRow[]>;
	}

	async getImportTasksByUrl(runSourceUrl: string): Promise<ImportTaskRow[]> {
		const response = await this.page.request.get('/api/v2/session_import/', {
			params: { url: runSourceUrl, page_size: 10000 }
		});

		await assertApiResponse(response, `load import task for ${runSourceUrl}`);

		const payload = (await response.json()) as ImportTaskListResponse;

		return payload.results ?? [];
	}

	async getImportTasksPage(page: number): Promise<ImportTaskListResponse> {
		const response = await this.page.request.get('/api/v2/session_import/', {
			params: { page, page_size: 10000 }
		});

		await assertApiResponse(response, `load import tasks page ${page}`);

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

	async findImportTaskHistoryByUrls(
		runSourceUrls: string[]
	): Promise<Map<string, ImportTaskRow[]>> {
		const expectedUrls = new Set(runSourceUrls.map(normalizeUrl));
		const tasksByUrl = new Map<string, ImportTaskRow[]>();

		for (const task of await this.getAllImportTasks()) {
			const normalizedUrl = normalizeUrl(task.run_source_url);

			if (!expectedUrls.has(normalizedUrl)) continue;

			const tasks = tasksByUrl.get(normalizedUrl) ?? [];
			tasks.push(task);
			tasksByUrl.set(normalizedUrl, tasks);
		}

		return tasksByUrl;
	}

	async findSuccessfulRunIdByUrl(runSourceUrl: string): Promise<number> {
		const expectedUrl = normalizeUrl(runSourceUrl);
		const taskHistory = (await this.getImportTasksByUrl(runSourceUrl)).filter(
			(task) => normalizeUrl(task.run_source_url) === expectedUrl
		);
		const successfulTask = selectReusableSuccessfulTask(taskHistory);
		const runId = successfulTask
			? successfulImportedRunId(successfulTask)
			: null;

		return runId ?? 0;
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
		const deadline = Date.now() + 600_000;
		let lastTasks: ImportTaskRow[] = [];
		let delay = 1000;

		while (Date.now() < deadline) {
			lastTasks = await this.getImportTasksByJob(jobId);
			const relevantTasks = lastTasks.filter((task) =>
				expected.has(normalizeUrl(task.run_source_url))
			);
			const latestTasksByUrl = new Map<string, ImportTaskRow>();
			for (const task of relevantTasks) {
				latestTasksByUrl.set(normalizeUrl(task.run_source_url), task);
			}
			const failed = [...latestTasksByUrl.values()].find(
				(task) => task.status.toUpperCase() === 'FAILURE'
			);
			if (failed) {
				throw new Error(
					`Import job ${jobId} failed for ${failed.run_source_url}: ${
						failed.error_msg || JSON.stringify(failed)
					}`
				);
			}

			if (
				[...expected].every((url) => {
					const latestTask = latestTasksByUrl.get(url);
					return (
						latestTask !== undefined &&
						successfulImportedRunId(latestTask) !== null
					);
				})
			) {
				return lastTasks;
			}

			await sleep(delay);
			delay = Math.min(delay * 2, 5000);
		}

		throw new Error(
			`Timed out waiting for import job ${jobId}. Last tasks: ${JSON.stringify(
				lastTasks
			)}`
		);
	}

	async closeResultModal(): Promise<void> {
		const closeButton = this.importModal.locator(
			'button[class*="absolute top-4"]'
		);
		await closeButton.click();
		await this.importModal
			.waitFor({ state: 'hidden', timeout: 5_000 })
			.catch(() => undefined);
	}
}

function sleep(delay: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delay));
}

async function assertApiResponse(
	response: APIResponse,
	action: string
): Promise<void> {
	if (response.ok()) return;

	const body = await response.text().catch(() => '<unreadable response>');
	throw new Error(
		`Failed to ${action}: ${response.status()} ${response.statusText()} at ${response.url()}\n${body}`
	);
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
export type { ScheduledImportTask };
