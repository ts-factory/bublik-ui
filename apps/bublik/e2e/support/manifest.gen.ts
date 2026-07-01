/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable */
/**
 * Generated from apps/bublik/e2e/support/e2e-manifest.schema.json — do not edit by hand.
 *
 * The schema comes from the bublik-e2e CLI's Pydantic models
 * (`bublik-e2e schema --out apps/bublik/e2e/support/e2e-manifest.schema.json`).
 * Regenerate with `pnpm run e2e:codegen` after updating the schema;
 * `pnpm run e2e:codegen:check` fails when this file is stale.
 */

/**
 * Top-level e2e manifest written to ``.e2e/e2e-manifest.json``.
 */
export interface E2EManifest {
	baseUrl: string;
	bundles: Bundle[];
	configs: ReportConfig[];
	dashboardUrl: string;
	emptyDates: string[];
	generatedAt: string;
	historyUrl: string;
	importUrl: string;
	uiBaseUrl: string;
	version: 1;
}
/**
 * One generated+published fixture run and everything derived from it.
 */
export interface Bundle {
	conclusionSpec: string;
	date: string;
	e2eRunId: string;
	expectedRuns: ExpectedRun[];
	finishTimestamp: string | null;
	fixture: string;
	id: string;
	importUrl: string;
	importVia?: 'api' | 'ui';
	logUrl?: string | null;
	logUrlTemplate: string;
	mix: string;
	project: string;
	revisions: Revision[];
	runId?: number | null;
	runStatus: string | null;
	runUrl?: string | null;
	runUrlTemplate: string;
	startTimestamp: string | null;
	tags: {
		[k: string]: unknown;
	};
}
/**
 * The expectations + samples the UI asserts against for one imported run.
 */
export interface ExpectedRun {
	dashboardDate: string;
	expectedConclusion: string;
	expectedConclusionReason: string | null;
	expectedMatrix: ExpectedMatrix;
	expectedStatus: string;
	expectedStatusByNok: string;
	iterationCount: number;
	logUrl?: string | null;
	measurements: MeasurementSummary[];
	name: string;
	packages: PackageSummary[];
	requirements: string[];
	runUrl?: string | null;
	sampleTests: {
		[k: string]: IterationEntry[];
	};
	tags: {
		[k: string]: unknown;
	};
	verdicts: string[];
}
/**
 * Expected result counts per (expectation, result-type) cell.
 *
 * Keys mirror ``core.constants.MATRIX_KEYS``; the generator always emits every
 * cell, so all fields are required.
 */
export interface ExpectedMatrix {
	abnormal: number;
	expectedCored: number;
	expectedFailed: number;
	expectedFaked: number;
	expectedIncomplete: number;
	expectedKilled: number;
	expectedPassed: number;
	expectedSkipped: number;
	unexpectedCored: number;
	unexpectedFailed: number;
	unexpectedFaked: number;
	unexpectedIncomplete: number;
	unexpectedKilled: number;
	unexpectedPassed: number;
	unexpectedSkipped: number;
}
/**
 * One flattened measurement entry across all leaf iterations.
 *
 * The generator always emits every key (values may be null), so all fields are
 * required; that keeps the schema honest and the generated TS types free of
 * spurious optionality.
 */
export interface MeasurementSummary {
	metric: string | null;
	testPath: string | null;
	tool: string | null;
	units: string | null;
	value: number | null;
}
/**
 * Per top-level package status rollup.
 */
export interface PackageSummary {
	byStatus: {
		[k: string]: number;
	};
	name: string | null;
	total: number;
}
/**
 * A sampled leaf iteration shown in the UI (see ``sampleTests``).
 *
 * ``params``/``verdicts``/``artifacts``/``measurements`` carry the raw,
 * provider-shaped payloads and are intentionally left loose.
 */
export interface IterationEntry {
	artifacts: unknown[];
	expectedStatus: string;
	measurements: unknown[];
	name: string | null;
	params: {
		[k: string]: unknown;
	};
	path: string[];
	pathStr: string;
	reqs: string[];
	status: string;
	tin: number | null;
	unexpected: boolean;
	verdicts: unknown[];
}
/**
 * A single source revision parsed from run metas (``*_GIT_URL`` etc.).
 */
export interface Revision {
	branch?: string | null;
	name: string;
	rev?: string | null;
	url?: string | null;
}
/**
 * A UI report config bundled into the manifest. ``content`` is free-form.
 */
export interface ReportConfig {
	content: {
		[k: string]: unknown;
	};
	description: string;
	name: string;
	project: string;
	type: 'report';
}
