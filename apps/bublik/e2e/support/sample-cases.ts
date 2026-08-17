/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readManifest } from './manifest';
import type {
	Bundle,
	E2EManifest,
	ExpectedRun,
	IterationEntry
} from './manifest';

interface SampleCase {
	label: string;
	runIndex: number;
	testName: string;
	testPath: string;
	sample: IterationEntry;
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

function sampleCases(bundle: Bundle): SampleCase[] {
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

function representativeRun(manifest: E2EManifest): {
	bundle: Bundle;
	expectedRun: ExpectedRun;
} {
	for (const bundle of manifest.bundles) {
		const expectedRun = bundle.expectedRuns[0];
		if (expectedRun) return { bundle, expectedRun };
	}

	throw new Error('Fixture manifest does not contain an expected run.');
}

function representativeNokRun(manifest: E2EManifest): {
	bundle: Bundle;
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

/**
 * Two imported runs sharing a dashboard date, so a single runs-page query lists
 * both — what the selection popover, /compare and /multiple scenarios need.
 */
function runPairOnSameDate(manifest: E2EManifest): {
	date: string;
	bundles: [Bundle, Bundle];
} | null {
	const byDate = new Map<string, Bundle[]>();

	for (const bundle of manifest.bundles) {
		const date = bundle.expectedRuns[0]?.dashboardDate;
		if (!bundle.runId || !date) continue;

		const bundles = byDate.get(date) ?? [];
		bundles.push(bundle);
		byDate.set(date, bundles);

		if (bundles.length >= 2) {
			return { date, bundles: [bundles[0], bundles[1]] };
		}
	}

	return null;
}

/**
 * The NOK counter on the dashboard and the runs table is the backend's
 * `unexpected` stat: every result carrying an "err" meta. In the fixture
 * manifest those are the `unexpected*` matrix entries plus `abnormal`.
 */
function expectedNokCount(expectedRun: ExpectedRun): number {
	return Object.entries(expectedRun.expectedMatrix)
		.filter(
			([category]) => category.startsWith('unexpected') || category === 'abnormal'
		)
		.reduce((total, [, count]) => total + count, 0);
}

function firstHistoryTestPath(fallback = 'net-drv-ts/rx_path/rx_fcs'): string {
	const manifest = readManifest();

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

export {
	expectedNokCount,
	firstHistoryTestPath,
	representativeNokRun,
	representativeRun,
	runPairOnSameDate,
	sampleCases
};
export type { SampleCase };
