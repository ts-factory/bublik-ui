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
	classification?: ClassificationManifest | null;
	configs: ReportConfig[];
	dashboardUrl: string;
	emptyDates: string[];
	generatedAt: string;
	historyUrl: string;
	importUrl: string;
	projects?: Project[];
	uiBaseUrl: string;
	version: 1;
}
/**
 * One generated+published fixture run and everything derived from it.
 */
export interface Bundle {
	conclusionSpec:
		| 'ok'
		| 'nok-warning'
		| 'nok-error'
		| 'warning'
		| 'error'
		| 'running'
		| 'busy'
		| 'stopped'
		| 'interrupted'
		| 'compromised';
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
	pinnedResults?: PinnedResult[];
	project: string;
	revisions: Revision[];
	runId?: number | null;
	runStatus:
		| (
				| 'DONE'
				| 'WARNING'
				| 'ERROR'
				| 'RUNNING'
				| 'BUSY'
				| 'STOPPED'
				| 'INTERRUPTED'
		  )
		| null;
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
	expectedConclusion:
		| 'run-ok'
		| 'run-warning'
		| 'run-error'
		| 'run-running'
		| 'run-busy'
		| 'run-stopped'
		| 'run-interrupted'
		| 'run-compromised';
	expectedConclusionReason: string | null;
	expectedMatrix: ExpectedMatrix;
	expectedStatus:
		| 'DONE'
		| 'WARNING'
		| 'ERROR'
		| 'RUNNING'
		| 'BUSY'
		| 'STOPPED'
		| 'INTERRUPTED';
	expectedStatusByNok: 'success' | 'warning' | 'error';
	iterationCount: number;
	logPages: LogPagesEntry[];
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
 * A leaf whose published log is worth navigating.
 *
 * Either the log is split across several JSON page files, or it is a single
 * file long enough that a line near its end is off screen on load. Shorter
 * leaves are omitted: every fixture leaf has a log, and listing them all would
 * bury the two or three a test can actually use.
 *
 * How many pages a log has is a property of how it was *published*, not of its
 * row count -- rgt cuts pages on raw-log byte size per node -- so it can only
 * be read off the emitted files, which is what the generator does.
 *
 * ``tin`` is informational. ``/api/v2/tree/`` returns no path, so the e2e suite
 * resolves these entries to tree nodes by ``name``; the fixture therefore gives
 * every iteration of a test the same page count, so whichever iteration the
 * lookup lands on matches this entry.
 */
export interface LogPagesEntry {
	name: string;
	pagesCount: number;
	path: string[];
	pathStr: string;
	rowCount: number;
	tin: number | null;
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
	expectedStatus:
		| 'PASSED'
		| 'FAILED'
		| 'SKIPPED'
		| 'KILLED'
		| 'CORED'
		| 'FAKED'
		| 'INCOMPLETE'
		| 'EMPTY';
	measurements: unknown[];
	name: string | null;
	params: {
		[k: string]: unknown;
	};
	path: string[];
	pathStr: string;
	reqs: string[];
	status:
		| 'PASSED'
		| 'FAILED'
		| 'SKIPPED'
		| 'KILLED'
		| 'CORED'
		| 'FAKED'
		| 'INCOMPLETE'
		| 'EMPTY';
	tin: number | null;
	unexpected: boolean;
	verdicts: unknown[];
}
/**
 * One leaf a classification pin forced, as generated into a bundle.
 *
 * The fixture tree is identical across every run of a fixture, so a pin
 * resolves to the same test and parameters in every run it applies to. That is
 * what lets a rule written against one run be asserted against another.
 */
export interface PinnedResult {
	params: {
		[k: string]: unknown;
	};
	pathStr: string;
	pin: string;
	status:
		| 'PASSED'
		| 'FAILED'
		| 'SKIPPED'
		| 'KILLED'
		| 'CORED'
		| 'FAKED'
		| 'INCOMPLETE'
		| 'EMPTY';
	test: string;
	tin: number;
	unexpected: boolean;
	verdicts: string[];
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
 * Everything the suite needs to drive and assert result classification.
 */
export interface ClassificationManifest {
	issues: ClassificationIssue[];
	pins: ClassificationPin[];
	rules: ClassificationRule[];
}
/**
 * An issue the plan declares. ``issueId`` is filled by --setup-classification.
 */
export interface ClassificationIssue {
	close: boolean;
	description: string | null;
	fixture?: string | null;
	id: string;
	issueId?: number | null;
	key: string | null;
	projectId?: number | null;
	projectName?: string | null;
	title: string;
}
/**
 * A pin, with the bundles it landed in split by import wave.
 */
export interface ClassificationPin {
	appliesTo: string[];
	conclusions: string[];
	fixture: string;
	id: string;
	iterations: number[];
	seededIn: string[];
	status:
		| 'PASSED'
		| 'FAILED'
		| 'SKIPPED'
		| 'KILLED'
		| 'CORED'
		| 'FAKED'
		| 'INCOMPLETE'
		| 'EMPTY';
	test: string;
	unexpected: boolean;
	verdicts: string[];
}
/**
 * A rule the plan declares. ``ruleId`` is filled by --setup-classification.
 *
 * ``match`` lists the matcher dimensions kept beyond the test, which is always
 * matched. An empty list is a test-only rule: it matches every iteration of
 * that test, in every run of the project.
 */
export interface ClassificationRule {
	active?: boolean;
	category:
		| 'product-defect'
		| 'test-bug'
		| 'env'
		| 'known-issue'
		| 'flaky'
		| 'to-investigate';
	classifiedResultIds?: number[];
	expected: boolean | null;
	id: string;
	issue: string;
	match: ('parameters' | 'verdicts' | 'tags')[];
	pin: string;
	ruleId?: number | null;
	scope: 'future' | 'oneoff';
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
/**
 * A Bublik project the fixtures land in, as --setup-projects configures it.
 */
export interface Project {
	fixtures: string[];
	name: string;
	trackers: Tracker[];
}
/**
 * An issue tracker, configured under ISSUES in a project's references config.
 *
 * ``id`` is the TRACKER of a ``ref://TRACKER/KEY`` bug key; a key whose
 * tracker is not configured in its project has no external link.
 */
export interface Tracker {
	id: string;
	name: string;
	uri: string;
}
