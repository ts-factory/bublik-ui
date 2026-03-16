/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Page, test as setup } from '@playwright/test';

import { ConfigPage } from './pages/config-page';
import { ImportPage, normalizeUrl } from './pages/import-page';
import { E2eManifest, requireManifest } from './support/manifest';
import { writeManifest } from './support/manifest-writer';

// eslint-disable-next-line playwright/expect-expect
setup(
	'Create projects, references and report configs, and import fixture runs',
	async ({ page }) => {
		setup.setTimeout(600_000);

		const manifest = requireManifest();
		const projectNames = [
			...new Set(manifest.bundles.map((bundle) => bundle.project))
		];
		const configPage = new ConfigPage(page);

		for (const projectName of projectNames) {
			await configPage.ensureProjectExists(projectName);
			await configPage.ensureReferencesConfigExists(
				projectName,
				createReferencesConfig(`${manifest.baseUrl.replace(/\/+$/, '')}/logs/`)
			);

			const reportConfigs = (manifest.configs ?? []).filter(
				(config) => config.project === projectName && config.type === 'report'
			);
			for (const config of reportConfigs) {
				await configPage.ensureReportConfigExists(
					projectName,
					config.name,
					JSON.stringify(config.content, null, 2)
				);
			}
		}
		await importFixtureCollection(page);
	}
);

async function importFixtureCollection(page: Page): Promise<void> {
	const manifest = requireManifest();
	const importPage = new ImportPage(page);

	// The database is the source of truth: a runId left over in the manifest
	// from a previous import is stale once the stack is brought up fresh, so
	// always reconcile against the DB (clearing values it no longer has) to
	// avoid skipping the import and leaving specs to run against an empty DB.
	const existingRunIdsByUrl = await importPage.findImportedRunIdsByUrls(
		manifest.bundles.map((bundle) => bundle.importUrl)
	);

	for (const bundle of manifest.bundles) {
		const existingRunId = existingRunIdsByUrl.get(
			normalizeUrl(bundle.importUrl)
		);
		bundle.runId =
			existingRunId && existingRunId > 0 ? existingRunId : undefined;
	}

	const missingBundles = manifest.bundles.filter((bundle) => !bundle.runId);
	if (missingBundles.length) {
		const scheduledTasks = await importPage.scheduleImports(
			missingBundles.map((bundle) => bundle.importUrl)
		);
		if (!scheduledTasks.length) {
			throw new Error('UI import did not return any scheduled fixture tasks.');
		}

		const tasksByJob = new Map<number, string[]>();
		for (const task of scheduledTasks) {
			const urls = tasksByJob.get(task.jobId) ?? [];
			urls.push(task.runSourceUrl);
			tasksByJob.set(task.jobId, urls);
		}

		const completedTasks = (
			await Promise.all(
				[...tasksByJob].map(([jobId, urls]) =>
					importPage.waitForSuccessfulJob(jobId, urls)
				)
			)
		).flat();
		const runIdsByUrl = new Map(
			completedTasks
				.filter((task) => Number(task.run_id) > 0)
				.map((task) => [normalizeUrl(task.run_source_url), Number(task.run_id)])
		);

		for (const bundle of manifest.bundles) {
			bundle.runId =
				runIdsByUrl.get(normalizeUrl(bundle.importUrl)) ?? bundle.runId;
		}
	}

	const unresolved = manifest.bundles.filter((bundle) => !bundle.runId);
	if (unresolved.length) {
		throw new Error(
			`Import completed without run IDs for: ${unresolved
				.map((bundle) => bundle.id)
				.join(', ')}`
		);
	}

	resolveDeepLinks(manifest);
	writeManifest(manifest);
}

function resolveDeepLinks(manifest: E2eManifest): void {
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

function createReferencesConfig(logsBaseUrl: string): string {
	return JSON.stringify(
		{
			REVISIONS: {
				TE_REV: {
					uri: 'https://github.com/ts-factory/test-environment',
					name: 'Test Environment'
				}
			},
			LOGS_BASES: [{ uri: [logsBaseUrl], name: 'Local Logs Base' }]
		},
		null,
		2
	);
}
