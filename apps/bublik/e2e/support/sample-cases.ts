/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readManifest } from './manifest';
import type {
	Bundle,
	E2EManifest,
	ExpectedRun,
	IterationEntry,
	LogPagesEntry
} from './manifest';

interface ProjectRun {
	project: string;
	runId: number;
}

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

function runPairOnSameDate(manifest: E2EManifest): {
	date: string;
	project: string;
	bundles: [Bundle, Bundle];
} | null {
	const byDateAndProject = new Map<string, Bundle[]>();

	for (const bundle of manifest.bundles) {
		const date = bundle.expectedRuns[0]?.dashboardDate;
		if (!bundle.runId || !date) continue;

		const key = `${date} ${bundle.project}`;
		const bundles = byDateAndProject.get(key) ?? [];
		bundles.push(bundle);
		byDateAndProject.set(key, bundles);

		if (bundles.length >= 2) {
			return {
				date,
				project: bundle.project,
				bundles: [bundles[0], bundles[1]]
			};
		}
	}

	return null;
}

function runPairOnDifferentProjects(manifest: E2EManifest): {
	date: string;
	runs: [ProjectRun, ProjectRun];
} | null {
	const byDate = new Map<string, ProjectRun[]>();

	for (const bundle of manifest.bundles) {
		const date = bundle.expectedRuns[0]?.dashboardDate;
		if (!bundle.runId || !date) continue;

		const runs = byDate.get(date) ?? [];
		const other = runs.find((run) => run.project !== bundle.project);

		if (other) {
			return {
				date,
				runs: [other, { project: bundle.project, runId: bundle.runId }]
			};
		}

		runs.push({ project: bundle.project, runId: bundle.runId });
		byDate.set(date, runs);
	}

	return null;
}

interface LogPagesCase {
	bundle: Bundle;
	expectedRun: ExpectedRun;
	runId: number;
	entry: LogPagesEntry;
}

function logPagesCases(manifest: E2EManifest): LogPagesCase[] {
	const cases: LogPagesCase[] = [];

	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		for (const expectedRun of bundle.expectedRuns) {
			for (const entry of expectedRun.logPages) {
				cases.push({ bundle, expectedRun, runId: bundle.runId, entry });
			}
		}
	}

	return cases;
}

function paginatedLogCase(manifest: E2EManifest): LogPagesCase | null {
	let best: LogPagesCase | null = null;

	for (const candidate of logPagesCases(manifest)) {
		if (candidate.entry.pagesCount < 2) continue;
		if (
			best &&
			candidate.entry.pagesCount <= best.entry.pagesCount &&
			candidate.entry.rowCount <= best.entry.rowCount
		) {
			continue;
		}

		best = candidate;
	}

	return best;
}

function longLogCase(manifest: E2EManifest): LogPagesCase | null {
	let best: LogPagesCase | null = null;

	for (const candidate of logPagesCases(manifest)) {
		if (candidate.entry.pagesCount !== 1) continue;
		if (best && candidate.entry.rowCount <= best.entry.rowCount) continue;

		best = candidate;
	}

	return best;
}

function durationCoveringFixtures(manifest: E2EManifest, padDays = 7): string {
	const days = manifest.bundles
		.flatMap((bundle) => bundle.expectedRuns)
		.map((expectedRun) => Date.parse(`${expectedRun.dashboardDate}T00:00:00Z`))
		.filter((time) => Number.isFinite(time));

	if (!days.length) {
		throw new Error('Fixture manifest contains no run with a dashboard date.');
	}

	const oldest = Math.min(...days);
	const elapsed = Math.ceil((Date.now() - oldest) / 86_400_000);

	return `P${Math.max(elapsed + padDays, padDays)}D`;
}

function projectSpanningDays(manifest: E2EManifest): {
	project: string;
	latestDate: string;
	latestRunIds: number[];
	earlierDate: string;
	earlierRunId: number;
} | null {
	const byProject = new Map<string, Map<string, number[]>>();

	for (const bundle of manifest.bundles) {
		const date = bundle.expectedRuns[0]?.dashboardDate;
		if (!bundle.runId || !date) continue;

		const dates = byProject.get(bundle.project) ?? new Map<string, number[]>();
		dates.set(date, [...(dates.get(date) ?? []), bundle.runId]);
		byProject.set(bundle.project, dates);
	}

	for (const [project, dates] of byProject) {
		if (dates.size < 2) continue;

		const sorted = [...dates.keys()].sort();
		const earlierDate = sorted[0];
		const latestDate = sorted[sorted.length - 1];

		return {
			project,
			latestDate,
			latestRunIds: (dates.get(latestDate) ?? []).slice(0, 3),
			earlierDate,
			earlierRunId: (dates.get(earlierDate) ?? [])[0]
		};
	}

	return null;
}

interface HistoryProject {
	project: string;
	testPath: string;
	runIds: number[];
}

function historyProjects(manifest: E2EManifest): HistoryProject[] {
	const byProject = new Map<
		string,
		{ counts: Map<string, number>; runIds: number[] }
	>();

	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		const entry = byProject.get(bundle.project) ?? {
			counts: new Map<string, number>(),
			runIds: []
		};
		entry.runIds.push(bundle.runId);

		for (const expectedRun of bundle.expectedRuns) {
			for (const samples of Object.values(expectedRun.sampleTests)) {
				for (const sample of samples) {
					const path = sample.pathStr || sample.path.join('/');
					if (!path || /\/(?:prologue|epilogue)$/.test(path)) continue;

					entry.counts.set(path, (entry.counts.get(path) ?? 0) + 1);
				}
			}
		}

		byProject.set(bundle.project, entry);
	}

	return [...byProject]
		.map(([project, entry]) => ({
			project,
			testPath: [...entry.counts]
				.sort(([, a], [, b]) => b - a)
				.map(([path]) => path)[0],
			runIds: entry.runIds
		}))
		.filter((entry): entry is HistoryProject => Boolean(entry.testPath));
}

function historyDateRange(manifest: E2EManifest): {
	startDate: string;
	finishDate: string;
} {
	const dates = manifest.bundles
		.map((bundle) => bundle.expectedRuns[0]?.dashboardDate || bundle.date)
		.filter(Boolean)
		.sort();

	if (!dates.length) {
		throw new Error('Fixture manifest does not contain a dated run.');
	}

	return {
		startDate: shiftDate(dates[0], -1),
		finishDate: shiftDate(dates[dates.length - 1], 1)
	};
}

function shiftDate(date: string, days: number): string {
	const shifted = new Date(`${date}T00:00:00Z`);
	shifted.setUTCDate(shifted.getUTCDate() + days);

	return shifted.toISOString().slice(0, 10);
}

function historyEmptyDate(manifest: E2EManifest): string | null {
	return manifest.emptyDates[0] ?? null;
}

function historyTestPathForProject(
	manifest: E2EManifest,
	project: string
): string | null {
	return (
		historyProjects(manifest).find((entry) => entry.project === project)
			?.testPath ?? null
	);
}

function historyProjectPair(manifest: E2EManifest): {
	selected: HistoryProject;
	other: HistoryProject;
} | null {
	const projects = historyProjects(manifest);

	for (const selected of projects) {
		const other = projects.find(
			(candidate) =>
				candidate.project !== selected.project &&
				candidate.testPath !== selected.testPath
		);

		if (other) return { selected, other };
	}

	return null;
}

function historyMeasurementTestPath(manifest: E2EManifest): {
	project: string;
	testPath: string;
} | null {
	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		for (const expectedRun of bundle.expectedRuns) {
			for (const samples of Object.values(expectedRun.sampleTests)) {
				for (const sample of samples) {
					if (!sample.measurements?.length) continue;

					return {
						project: bundle.project,
						testPath: sample.pathStr || sample.path.join('/')
					};
				}
			}
		}
	}

	return null;
}

function mutableRun(manifest: E2EManifest): {
	bundle: Bundle;
	expectedRun: ExpectedRun;
} | null {
	const { bundle: representative } = representativeRun(manifest);

	const candidates = manifest.bundles.filter(
		(bundle) =>
			bundle.runId &&
			bundle.project === representative.project &&
			bundle.conclusionSpec === 'ok' &&
			bundle.id !== representative.id &&
			bundle.expectedRuns[0]
	);

	const latest = candidates.reduce<Bundle | null>((best, bundle) => {
		if (!best) return bundle;
		return bundle.date >= best.date ? bundle : best;
	}, null);

	if (!latest) return null;

	return { bundle: latest, expectedRun: latest.expectedRuns[0] };
}

function expectedNokCount(expectedRun: ExpectedRun): number {
	return Object.entries(expectedRun.expectedMatrix)
		.filter(
			([category]) =>
				category.startsWith('unexpected') || category === 'abnormal'
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

function samplesByTestPath(
	expectedRun: ExpectedRun
): Map<string, IterationEntry[]> {
	const byPath = new Map<string, IterationEntry[]>();

	for (const samples of Object.values(expectedRun.sampleTests)) {
		for (const sample of samples) {
			const path = sample.pathStr || sample.path.join('/');
			if (!path) continue;

			byPath.set(path, [...(byPath.get(path) ?? []), sample]);
		}
	}

	return byPath;
}

function runsBadgeDate(manifest: E2EManifest): {
	date: string;
	runIds: number[];
} | null {
	const byDate = new Map<string, Bundle[]>();

	for (const bundle of manifest.bundles) {
		const date = bundle.expectedRuns[0]?.dashboardDate;
		if (!bundle.runId || !date) continue;

		byDate.set(date, [...(byDate.get(date) ?? []), bundle]);
	}

	const candidates = [...byDate]
		.map(([date, bundles]) => ({
			date,
			bundles,
			distinctTagSets: new Set(
				bundles.map((bundle) =>
					Object.entries(bundle.tags)
						.map(([key, value]) => `${key}=${String(value)}`)
						.sort()
						.join(';')
				)
			).size
		}))
		.filter((entry) => entry.bundles.length >= 2 && entry.distinctTagSets >= 2)
		.sort((a, b) => b.bundles.length - a.bundles.length);

	const best = candidates[0];
	if (!best) return null;

	return {
		date: best.date,
		runIds: best.bundles
			.map((bundle) => bundle.runId)
			.filter((runId): runId is number => Number(runId) > 0)
	};
}

interface ResultTableCase {
	bundle: Bundle;
	runId: number;
	path: string[];
	testName: string;
	iterationCount: number;
}

function artifactResultCase(manifest: E2EManifest): ResultTableCase | null {
	return findResultTableCase(manifest, (samples) => {
		const artifactSets = new Set(
			samples.map((sample) => JSON.stringify(sample.artifacts))
		);

		return (
			artifactSets.size >= 2 &&
			samples.some((sample) => sample.artifacts.length > 0)
		);
	});
}

function requirementResultCase(manifest: E2EManifest): ResultTableCase | null {
	return findResultTableCase(manifest, (samples) => {
		const requirementSets = new Set(
			samples.map((sample) => [...sample.reqs].sort().join(';'))
		);

		return (
			requirementSets.size >= 2 &&
			samples.some((sample) => sample.reqs.length > 0) &&
			samples.some((sample) => sample.verdicts.length > 0)
		);
	});
}

function findResultTableCase(
	manifest: E2EManifest,
	matches: (samples: IterationEntry[]) => boolean
): ResultTableCase | null {
	const candidates: ResultTableCase[] = [];

	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		for (const expectedRun of bundle.expectedRuns) {
			for (const [path, samples] of samplesByTestPath(expectedRun)) {
				if (samples.length < 2 || !matches(samples)) continue;

				candidates.push({
					bundle,
					runId: bundle.runId,
					path: path.split('/'),
					testName: samples[0].name || path.split('/').pop() || path,
					iterationCount: expectedRun.iterationCount
				});
			}
		}
	}

	return (
		candidates.sort((a, b) => a.iterationCount - b.iterationCount)[0] ?? null
	);
}

function historyBadgeCase(manifest: E2EManifest): {
	project: string;
	testPath: string;
	distinctParameterSets: number;
} | null {
	const byPath = new Map<
		string,
		{ project: string; parameterSets: Set<string>; sampleCount: number }
	>();

	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		for (const expectedRun of bundle.expectedRuns) {
			for (const [path, samples] of samplesByTestPath(expectedRun)) {
				if (/\/(?:prologue|epilogue)$/.test(path)) continue;

				const key = `${bundle.project} ${path}`;
				const entry = byPath.get(key) ?? {
					project: bundle.project,
					parameterSets: new Set<string>(),
					sampleCount: 0
				};

				for (const sample of samples) {
					entry.parameterSets.add(
						Object.entries(sample.params)
							.map(([name, value]) => `${name}=${String(value)}`)
							.sort()
							.join(';')
					);
				}

				entry.sampleCount += samples.length;
				byPath.set(key, entry);
			}
		}
	}

	const best = [...byPath]
		.map(([key, entry]) => ({
			project: entry.project,
			testPath: key.slice(entry.project.length + 1),
			distinctParameterSets: entry.parameterSets.size,
			sampleCount: entry.sampleCount
		}))
		.filter((entry) => entry.distinctParameterSets >= 4)
		.sort(
			(a, b) =>
				b.sampleCount - a.sampleCount ||
				b.distinctParameterSets - a.distinctParameterSets
		)[0];

	if (!best) return null;

	return {
		project: best.project,
		testPath: best.testPath,
		distinctParameterSets: best.distinctParameterSets
	};
}

export {
	artifactResultCase,
	expectedNokCount,
	firstHistoryTestPath,
	historyBadgeCase,
	historyDateRange,
	historyEmptyDate,
	historyMeasurementTestPath,
	historyProjectPair,
	historyProjects,
	historyTestPathForProject,
	durationCoveringFixtures,
	longLogCase,
	mutableRun,
	paginatedLogCase,
	projectSpanningDays,
	representativeNokRun,
	representativeRun,
	requirementResultCase,
	runPairOnDifferentProjects,
	runPairOnSameDate,
	runsBadgeDate,
	sampleCases,
	shiftDate
};
export type {
	HistoryProject,
	LogPagesCase,
	ProjectRun,
	ResultTableCase,
	SampleCase
};
