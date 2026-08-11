/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { test as setup } from '@playwright/test';

import { ImportPage, normalizeUrl } from './pages/import-page';
import { requireManifest } from './support/manifest';
import type { Bundle, E2EManifest } from './support/manifest';
import { writeManifest } from './support/manifest-writer';

// The bublik-e2e CLI is the canonical seeding path: `bublik-e2e run/import
// --setup-projects` creates projects and configs and imports every bundle
// marked importVia=api, writing the runIds back into the manifest. This setup
// only imports the bundles marked importVia=ui through the import form — which
// keeps that form under real test — and fails fast when the API bundles were
// never seeded.
// eslint-disable-next-line playwright/expect-expect
setup(
	'Import UI-marked fixture runs through the import form',
	async ({ page }) => {
		setup.setTimeout(600_000);

		const manifest = requireManifest();
		const importPage = new ImportPage(page);

		// The database is the source of truth: a runId left over in the manifest
		// from a previous import is stale once the stack is brought up fresh, so
		// always reconcile against the DB (clearing values it no longer has).
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

		resolveDeepLinks(manifest);
		writeManifest(manifest);
	}
);

async function importThroughUi(
	importPage: ImportPage,
	bundles: Bundle[]
): Promise<void> {
	const scheduledTasks = await importPage.scheduleImports(
		bundles.map((bundle) => bundle.importUrl)
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
