/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/no-conditional-in-test */
import { test as setup } from './support/test';

import { ImportPage, normalizeUrl } from './pages/import-page';
import {
	validateFixtureCapabilities,
	validateImportedCapabilities
} from './support/capabilities';
import {
	selectInProgressTask,
	selectReusableSuccessfulTask,
	successfulImportedRunId
} from './support/import-task-state';
import type { ImportTaskRow } from './support/import-task-state';
import { requireManifest } from './support/manifest';
import type { Bundle, E2EManifest } from './support/manifest';
import { writeManifest } from './support/manifest-writer';

// eslint-disable-next-line playwright/expect-expect
setup(
	'Import UI-marked fixture runs through the import form',
	async ({ page }) => {
		setup.setTimeout(1_200_000);

		const manifest = requireManifest();
		validateFixtureCapabilities(manifest);
		const importPage = new ImportPage(page);

		const taskHistoryByUrl = await importPage.findImportTaskHistoryByUrls(
			manifest.bundles.map((bundle) => bundle.importUrl)
		);
		for (const bundle of manifest.bundles) {
			const taskHistory = taskHistoryByUrl.get(normalizeUrl(bundle.importUrl));
			const successfulTask = selectReusableSuccessfulTask(taskHistory);
			bundle.runId = successfulTask
				? successfulImportedRunId(successfulTask) ?? undefined
				: undefined;
		}

		assertNoFailedImports(manifest.bundles, taskHistoryByUrl);
		await reattachInProgressImports(
			importPage,
			manifest.bundles,
			taskHistoryByUrl
		);

		const missingApiBundles = manifest.bundles.filter(
			(bundle) => bundle.importVia !== 'ui' && !bundle.runId
		);
		if (missingApiBundles.length) {
			throw new Error(
				'API-imported fixture runs are missing from the instance: ' +
					`${missingApiBundles.map((bundle) => bundle.id).join(', ')}. ` +
					'Seed them first with `task e2e:seed` (bublik-e2e run/import).'
			);
		}

		const pendingUiBundles = manifest.bundles.filter(
			(bundle) => bundle.importVia === 'ui' && !bundle.runId
		);
		if (pendingUiBundles.length) {
			await importThroughUi(importPage, pendingUiBundles);
		}

		validateImportedCapabilities(manifest);
		resolveDeepLinks(manifest);
		writeManifest(manifest);
	}
);

async function importThroughUi(
	importPage: ImportPage,
	bundles: Bundle[]
): Promise<void> {
	const tasksByJob = new Map<number, string[]>();
	const scheduledTasks = await importPage.scheduleImports(
		bundles.map((bundle) => bundle.importUrl)
	);
	if (!scheduledTasks.length) {
		throw new Error('UI import did not return any scheduled fixture tasks.');
	}

	for (const task of scheduledTasks) {
		addTaskToJob(tasksByJob, task.jobId, task.runSourceUrl);
	}

	const completedTasks = (
		await Promise.all(
			[...tasksByJob].map(([jobId, urls]) =>
				importPage.waitForSuccessfulJob(jobId, urls)
			)
		)
	).flat();
	const runIdsByUrl = new Map(
		completedTasks.flatMap((task) => {
			const runId = successfulImportedRunId(task);
			return runId === null
				? []
				: [[normalizeUrl(task.run_source_url), runId] as const];
		})
	);

	for (const bundle of bundles) {
		bundle.runId =
			runIdsByUrl.get(normalizeUrl(bundle.importUrl)) ?? bundle.runId;
	}

	const unresolved = bundles.filter((bundle) => !bundle.runId);
	if (unresolved.length) {
		throw new Error(
			`UI import completed without run IDs for: ${unresolved
				.map((bundle) => bundle.id)
				.join(', ')}`
		);
	}
}

async function reattachInProgressImports(
	importPage: ImportPage,
	bundles: Bundle[],
	taskHistoryByUrl: Map<string, ImportTaskRow[]>
): Promise<void> {
	const tasksByJob = new Map<number, string[]>();
	for (const bundle of bundles) {
		const taskHistory = taskHistoryByUrl.get(normalizeUrl(bundle.importUrl));
		const task = selectInProgressTask(taskHistory);
		if (task) {
			bundle.runId = undefined;
			if (!Number.isFinite(task.job_id) || Number(task.job_id) <= 0) {
				throw new Error(
					`In-progress import for ${bundle.id} has no valid job_id.`
				);
			}

			addTaskToJob(tasksByJob, Number(task.job_id), bundle.importUrl);
		}
	}

	const completedTasks = (
		await Promise.all(
			[...tasksByJob].map(([jobId, urls]) =>
				importPage.waitForSuccessfulJob(jobId, urls)
			)
		)
	).flat();
	const runIdsByUrl = new Map(
		completedTasks.flatMap((task) => {
			const runId = successfulImportedRunId(task);
			return runId === null
				? []
				: [[normalizeUrl(task.run_source_url), runId] as const];
		})
	);

	for (const bundle of bundles) {
		bundle.runId =
			runIdsByUrl.get(normalizeUrl(bundle.importUrl)) ?? bundle.runId;
	}
}

function addTaskToJob(
	tasksByJob: Map<number, string[]>,
	jobId: number,
	runSourceUrl: string
): void {
	const urls = tasksByJob.get(jobId) ?? [];
	urls.push(runSourceUrl);
	tasksByJob.set(jobId, urls);
}

function assertNoFailedImports(
	bundles: Bundle[],
	taskHistoryByUrl: Map<string, ImportTaskRow[]>
): void {
	const failures = bundles.flatMap((bundle) => {
		const taskHistory = taskHistoryByUrl.get(normalizeUrl(bundle.importUrl));
		const latestTask = taskHistory?.[0];
		if (
			!latestTask ||
			latestTask.status.toUpperCase() !== 'FAILURE' ||
			selectReusableSuccessfulTask(taskHistory) !== undefined
		) {
			return [];
		}

		return [
			`${bundle.id} (job ${latestTask.job_id ?? 'unknown'}): ${
				latestTask.error_msg || 'import task failed without an error message'
			}`
		];
	});

	if (failures.length) {
		throw new Error(
			`Latest fixture import tasks failed; refusing to retry implicitly:\n${failures.join(
				'\n'
			)}`
		);
	}
}

function resolveDeepLinks(manifest: E2EManifest): void {
	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;
		const runUrl = bundle.runUrlTemplate?.replace(
			'{runId}',
			String(bundle.runId)
		);
		const logUrl = bundle.logUrlTemplate?.replace(
			'{runId}',
			String(bundle.runId)
		);
		if (runUrl) bundle.runUrl = runUrl;
		if (logUrl) bundle.logUrl = logUrl;
		for (const expectedRun of bundle.expectedRuns) {
			if (runUrl) expectedRun.runUrl = runUrl;
			if (logUrl) expectedRun.logUrl = logUrl;
		}
	}
}
