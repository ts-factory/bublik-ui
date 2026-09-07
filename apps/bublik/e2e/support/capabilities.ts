/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { E2EManifest } from './manifest';

const LONG_LOG_ROWS = 200;

function requireCapability<T>(
	value: T | null | undefined,
	reason: string
): NonNullable<T> {
	if (value == null || value === false) {
		throw new Error(`Required E2E capability is missing: ${reason}`);
	}

	return value as NonNullable<T>;
}

function validateFixtureCapabilities(manifest: E2EManifest): void {
	const expectedRuns = manifest.bundles.flatMap(
		(bundle) => bundle.expectedRuns
	);
	const samples = expectedRuns.flatMap((run) =>
		Object.values(run.sampleTests).flat()
	);
	const hasNokSamples = expectedRuns.some((run) =>
		Object.entries(run.sampleTests).some(
			([category, entries]) =>
				(category.startsWith('unexpected') || category === 'abnormal') &&
				entries.length > 0
		)
	);

	requireCapability(
		manifest.bundles.some((bundle) => bundle.importVia === 'ui'),
		'the fixture plan must contain an importVia=ui bundle'
	);
	requireCapability(
		manifest.bundles.length >= 2,
		'the fixture plan must contain at least two runs for compare coverage'
	);
	requireCapability(
		hasNokSamples,
		'the fixture plan must contain an unexpected or abnormal result sample'
	);
	requireCapability(
		samples.some((sample) => sample.measurements.length > 0),
		'the fixture plan must contain a sampled result with measurements'
	);
	const logPages = expectedRuns.flatMap((run) => run.logPages);

	requireCapability(
		logPages.some((entry) => entry.pagesCount > 1),
		'the fixture plan must contain a result whose log spans several pages'
	);
	requireCapability(
		logPages.some(
			(entry) => entry.pagesCount === 1 && entry.rowCount >= LONG_LOG_ROWS
		),
		'the fixture plan must contain a long single-page log'
	);
	requireCapability(
		manifest.emptyDates.length > 0,
		'the fixture plan must contain an empty dashboard date'
	);
	requireCapability(
		manifest.configs.some((config) =>
			manifest.bundles.some(
				(bundle) =>
					bundle.project === config.project && bundle.expectedRuns.length > 0
			)
		),
		'the fixture plan must contain a run whose project has a report config'
	);
}

function validateImportedCapabilities(manifest: E2EManifest): void {
	const importedRunIds = new Set(
		manifest.bundles
			.map((bundle) => bundle.runId)
			.filter((runId): runId is number => Number(runId) > 0)
	);

	requireCapability(
		importedRunIds.size >= 2,
		'import reconciliation must produce at least two distinct run IDs'
	);
	requireCapability(
		manifest.configs.some((config) =>
			manifest.bundles.some(
				(bundle) =>
					bundle.project === config.project && Number(bundle.runId) > 0
			)
		),
		'import reconciliation must produce a run whose project has a report config'
	);
}

export {
	requireCapability,
	validateFixtureCapabilities,
	validateImportedCapabilities
};
