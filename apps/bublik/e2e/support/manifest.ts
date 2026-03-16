/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readFileSync } from 'fs';
import path from 'path';

interface SampleTest {
	name: string;
	tin: unknown;
	path: string[];
	pathStr: string;
	params: Record<string, string>;
	reqs: string[];
	status: string;
	expectedStatus: string;
	unexpected: boolean;
	verdicts: unknown[];
	artifacts: unknown[];
	measurements: unknown[];
}

interface Revision {
	name: string;
	url?: string;
	branch?: string;
	rev?: string;
}

interface PackageSummary {
	name: string;
	total: number;
	byStatus: Record<string, number>;
}

interface MeasurementSummary {
	testPath: string;
	tool?: string;
	metric?: string;
	value?: number;
	units?: string;
}

interface ExpectedMatrix {
	expectedPassed: number;
	unexpectedPassed: number;
	expectedFailed: number;
	unexpectedFailed: number;
	expectedSkipped: number;
	unexpectedSkipped: number;
	expectedKilled: number;
	unexpectedKilled: number;
	expectedCored: number;
	unexpectedCored: number;
	expectedFaked: number;
	unexpectedFaked: number;
	expectedIncomplete: number;
	unexpectedIncomplete: number;
	abnormal: number;
}

interface ExpectedRun {
	name: string;
	dashboardDate: string;
	iterationCount: number;
	expectedStatus: string;
	expectedStatusByNok: string;
	expectedConclusion: string;
	expectedConclusionReason?: string | null;
	expectedMatrix: ExpectedMatrix;
	tags?: Record<string, string | null>;
	requirements?: string[];
	verdicts?: string[];
	measurements?: MeasurementSummary[];
	packages?: PackageSummary[];
	sampleTests: Record<string, SampleTest[]>;
	runUrl?: string;
	logUrl?: string;
}

interface BundleEntry {
	id: string;
	fixture?: string;
	conclusionSpec?: string;
	mix?: string;
	date?: string;
	importUrl: string;
	project: string;
	e2eRunId: string;
	runId?: number;
	runStatus?: string;
	startTimestamp?: string;
	finishTimestamp?: string;
	tags?: Record<string, string | null>;
	revisions?: Revision[];
	runUrlTemplate?: string;
	logUrlTemplate?: string;
	runUrl?: string;
	logUrl?: string;
	expectedRuns: ExpectedRun[];
}

interface ManifestConfig {
	project: string;
	type: string;
	name: string;
	description?: string;
	content: unknown;
}

interface E2eManifest {
	version: number;
	generatedAt?: string;
	baseUrl: string;
	uiBaseUrl: string;
	dashboardUrl?: string;
	historyUrl?: string;
	importUrl: string;
	emptyDates?: string[];
	configs?: ManifestConfig[];
	bundles: BundleEntry[];
}

function resolveManifestPath(): string {
	if (process.env['BUBLIK_E2E_RUN_OVERVIEW']) {
		return path.resolve(process.env['BUBLIK_E2E_RUN_OVERVIEW']);
	}

	return path.resolve(process.cwd(), '..', '..', '.e2e', 'e2e-manifest.json');
}

function readManifest(): E2eManifest | null {
	try {
		const raw = readFileSync(resolveManifestPath(), 'utf-8');
		return JSON.parse(raw) as E2eManifest;
	} catch {
		return null;
	}
}

function requireManifest(): E2eManifest {
	const manifest = readManifest();

	if (!manifest) {
		throw new Error('BUBLIK_E2E_RUN_OVERVIEW not set or manifest is empty.');
	}
	if (manifest.version !== 1) {
		throw new Error(`Unsupported E2E manifest version: ${manifest.version}`);
	}

	return manifest;
}

export { readManifest, requireManifest, resolveManifestPath };

export type {
	E2eManifest,
	ManifestConfig,
	BundleEntry,
	ExpectedRun,
	ExpectedMatrix,
	SampleTest,
	Revision,
	PackageSummary,
	MeasurementSummary
};
