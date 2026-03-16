/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	BundleEntry,
	E2eManifest,
	ExpectedRun,
	readManifest,
	SampleTest
} from './manifest';

interface SampleCase {
	label: string;
	runIndex: number;
	testName: string;
	testPath: string;
	sample: SampleTest;
}

const labelsByCategory: Record<string, string> = {
	expectedPassed: 'Expected PASSED',
	unexpectedPassed: 'Unexpected PASSED',
	expectedFailed: 'Expected FAILED',
	unexpectedFailed: 'Unexpected FAILED',
	expectedSkipped: 'Expected SKIPPED',
	unexpectedSkipped: 'Unexpected SKIPPED',
	expectedKilled: 'Expected KILLED',
	expectedCored: 'Expected CORED',
	abnormal: 'ABNORMAL'
};

function sampleCases(bundle: BundleEntry): SampleCase[] {
	return bundle.expectedRuns.flatMap((expectedRun, runIndex) =>
		Object.entries(labelsByCategory).flatMap(([category, label]) =>
			(expectedRun.sampleTests[category] ?? []).slice(0, 1).map((sample) => ({
				label,
				runIndex,
				testName: sample.name || sample.pathStr,
				testPath: sample.pathStr || sample.path.join('/'),
				sample
			}))
		)
	);
}

function representativeRun(manifest: E2eManifest): {
	bundle: BundleEntry;
	expectedRun: ExpectedRun;
} {
	for (const bundle of manifest.bundles) {
		const expectedRun = bundle.expectedRuns[0];
		if (expectedRun) return { bundle, expectedRun };
	}

	throw new Error('Fixture manifest does not contain an expected run.');
}

function representativeNokRun(manifest: E2eManifest): {
	bundle: BundleEntry;
	expectedRun: ExpectedRun;
	sampleNames: string[];
} | null {
	for (const bundle of manifest.bundles) {
		for (const expectedRun of bundle.expectedRuns) {
			const sampleNames = Object.entries(expectedRun.sampleTests)
				.filter(
					([category]) =>
						category.startsWith('unexpected') || category === 'abnormal'
				)
				.flatMap(([, samples]) => samples)
				.map((sample) => sample.name || sample.pathStr)
				.filter(Boolean)
				.slice(0, 2);

			if (sampleNames.length) return { bundle, expectedRun, sampleNames };
		}
	}

	return null;
}

function firstHistoryTestPath(fallback = 'net-drv-ts/rx_path/rx_fcs'): string {
	const manifest = readManifestSafe();

	if (!manifest) return fallback;

	for (const bundle of manifest.bundles) {
		for (const run of bundle.expectedRuns) {
			const failed =
				run.sampleTests.expectedFailed || run.sampleTests.unexpectedFailed;
			if (failed && failed.length > 0) {
				return failed[0].pathStr || failed[0].path.join('/');
			}

			const passed =
				run.sampleTests.expectedPassed || run.sampleTests.unexpectedPassed;
			if (passed && passed.length > 0) {
				return passed[0].pathStr || passed[0].path.join('/');
			}
		}
	}

	return fallback;
}

function readManifestSafe() {
	return readManifest() as E2eManifest | null;
}

export {
	firstHistoryTestPath,
	representativeNokRun,
	representativeRun,
	sampleCases
};
export type { SampleCase };
