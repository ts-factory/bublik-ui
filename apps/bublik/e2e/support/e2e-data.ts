/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import type {
	Bundle,
	E2EManifest,
	ExpectedRun,
	IterationEntry,
	LogPagesEntry
} from './manifest';
import {
	longLogCase,
	paginatedLogCase,
	representativeRun
} from './sample-cases';

interface TreeNode {
	id: string;
	name: string;
	entity: string;
	path?: string | null;
	has_error?: boolean;
	children?: string[];
}

interface TreeResponse {
	main_package: string;
	tree: Record<string, TreeNode>;
}

interface ImportedRunCase {
	bundle: Bundle;
	expectedRun: ExpectedRun;
	runId: number;
}

interface ResultNodeCase {
	runCase: ImportedRunCase;
	node: TreeNode;
	sample?: IterationEntry;
}

interface LogPagesNodeCase {
	runCase: ImportedRunCase;
	node: TreeNode;
	entry: LogPagesEntry;
}

interface ReportConfig {
	id: number;
	name: string;
}

interface ReportPoint {
	metadata?: { result_id?: number };
}

interface ReportRecordBlock {
	id: string;
	label?: string | null;
	table?: { data: { points: ReportPoint[] }[] } | null;
}

interface ReportMeasurementBlock {
	id: string;
	label: string;
	content: ReportRecordBlock[];
}

interface ReportArgsValBlock {
	id: string;
	label: string;
	content: ReportMeasurementBlock[];
}

interface ReportTestBlock {
	id: string;
	type: string;
	label: string;
	content: ReportArgsValBlock[];
}

interface ReportPayload {
	content: ReportTestBlock[];
}

interface ReportItem {
	id: string;
	label: string;
}

interface ReportCell {
	recordId: string;
	resultId: number;
}

interface ReportFixture {
	runCase: ImportedRunCase;
	runId: number;
	configId: number;
	testBlocks: ReportItem[];
	argValItems: ReportItem[];
	measurementItems: ReportItem[];
	recordItems: ReportItem[];
	cells: ReportCell[];
}

function importedRunId(bundle: Bundle): number {
	if (!bundle.runId) {
		throw new Error(`Fixture run "${bundle.id}" has no imported runId.`);
	}
	return bundle.runId;
}

function representativeImportedRun(manifest: E2EManifest): ImportedRunCase {
	const { bundle, expectedRun } = representativeRun(manifest);
	return { bundle, expectedRun, runId: importedRunId(bundle) };
}

function reportConfiguredImportedRun(manifest: E2EManifest): ImportedRunCase {
	const configuredProjects = new Set(
		manifest.configs.map((config) => config.project)
	);

	for (const bundle of manifest.bundles) {
		const expectedRun = bundle.expectedRuns[0];
		if (bundle.runId && expectedRun && configuredProjects.has(bundle.project)) {
			return { bundle, expectedRun, runId: importedRunId(bundle) };
		}
	}

	throw new Error(
		'Required E2E capability is missing: no imported run project has an applicable manifest report config.'
	);
}

async function getTree(
	request: APIRequestContext,
	runId: number
): Promise<TreeResponse> {
	const response = await request.get(`/api/v2/tree/${runId}`);
	expect(response.ok()).toBeTruthy();
	return response.json() as Promise<TreeResponse>;
}

function findFirstTestNode(tree: TreeResponse): TreeNode | null {
	return (
		Object.values(tree.tree).find((node) => node.entity === 'test') ?? null
	);
}

function findFirstErrorTestNode(tree: TreeResponse): TreeNode | null {
	return (
		Object.values(tree.tree).find(
			(node) => node.entity === 'test' && node.has_error
		) ?? null
	);
}

type TreeNodeLookup = Pick<IterationEntry, 'name' | 'path' | 'pathStr'>;

function findSampleNode(
	tree: TreeResponse,
	sample: TreeNodeLookup
): TreeNode | null {
	const path = sample.pathStr || sample.path.join('/');

	return (
		Object.values(tree.tree).find(
			(node) =>
				node.entity === 'test' &&
				(node.path === path || node.name === sample.name)
		) ?? null
	);
}

async function firstResultNode(
	request: APIRequestContext,
	runCase: ImportedRunCase
): Promise<ResultNodeCase | null> {
	const tree = await getTree(request, runCase.runId);
	const node = findFirstTestNode(tree);

	return node ? { runCase, node } : null;
}

async function firstErrorResultNode(
	request: APIRequestContext,
	runCase: ImportedRunCase
): Promise<ResultNodeCase | null> {
	const tree = await getTree(request, runCase.runId);
	const node = findFirstErrorTestNode(tree);

	return node ? { runCase, node } : null;
}

async function firstMeasurementResultNode(
	request: APIRequestContext,
	manifest: E2EManifest
): Promise<ResultNodeCase | null> {
	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;
		if (!bundle.expectedRuns[0]) continue;

		const runCase = {
			bundle,
			expectedRun: bundle.expectedRuns[0],
			runId: importedRunId(bundle)
		};
		const tree = await getTree(request, runCase.runId);

		for (const expectedRun of bundle.expectedRuns) {
			for (const samples of Object.values(expectedRun.sampleTests)) {
				for (const sample of samples) {
					if (!sample.measurements?.length) continue;

					const node = findSampleNode(tree, sample);
					if (node) {
						return { runCase: { ...runCase, expectedRun }, node, sample };
					}
				}
			}
		}
	}

	return null;
}

async function logPagesNode(
	request: APIRequestContext,
	manifest: E2EManifest,
	pick: typeof paginatedLogCase
): Promise<LogPagesNodeCase | null> {
	const logCase = pick(manifest);
	if (!logCase) return null;

	const tree = await getTree(request, logCase.runId);
	const node = findSampleNode(tree, logCase.entry);
	if (!node) return null;

	return {
		runCase: {
			bundle: logCase.bundle,
			expectedRun: logCase.expectedRun,
			runId: logCase.runId
		},
		node,
		entry: logCase.entry
	};
}

async function paginatedLogNode(
	request: APIRequestContext,
	manifest: E2EManifest
): Promise<LogPagesNodeCase | null> {
	return logPagesNode(request, manifest, paginatedLogCase);
}

async function longLogNode(
	request: APIRequestContext,
	manifest: E2EManifest
): Promise<LogPagesNodeCase | null> {
	return logPagesNode(request, manifest, longLogCase);
}

async function dashboardCellDestination(
	request: APIRequestContext,
	date: string,
	runId: number,
	cellKey: string
): Promise<RegExp | null> {
	const response = await request.get(`/api/v2/dashboard/?date=${date}`);
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as {
		rows: {
			context: { run_id: number };
			row_cells: Record<string, { payload?: { url?: string } } | unknown>;
		}[];
	};

	const row = payload.rows.find(
		(candidate) => candidate.context.run_id === runId
	);
	const cell = row?.row_cells[cellKey] as
		| { payload?: { url?: string } }
		| undefined;

	switch (cell?.payload?.url) {
		case 'runs':
			return new RegExp(`/runs/${runId}(?:$|[?#/])`);
		case 'tree':
			return new RegExp(`/log/${runId}(?:$|[?#/])`);
		default:
			return null;
	}
}

async function firstReportConfig(
	page: Page,
	runId: number
): Promise<ReportConfig | null> {
	const response = await page.request.get(`/api/v2/report/${runId}/configs`);
	expect(response.ok()).toBeTruthy();
	const payload = (await response.json()) as {
		run_report_configs?: ReportConfig[];
	};

	return payload.run_report_configs?.[0] ?? null;
}

async function reportFixture(
	page: Page,
	manifest: E2EManifest
): Promise<ReportFixture> {
	const runCase = reportConfiguredImportedRun(manifest);
	const config = await firstReportConfig(page, runCase.runId);

	if (!config) {
		throw new Error(
			`Fixture setup did not create a report config for run ${runCase.runId}.`
		);
	}

	const response = await page.request.get(
		`/api/v2/report/${runCase.runId}/?config=${config.id}`
	);
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as ReportPayload;
	const testBlocks = payload.content.filter(
		(block) => block.type === 'test-block'
	);

	if (!testBlocks.length) {
		throw new Error(
			`Report ${config.id} for run ${runCase.runId} contains no test blocks.`
		);
	}

	const argValBlocks = testBlocks.flatMap((block) => block.content);
	const measurementBlocks = argValBlocks.flatMap((block) => block.content);
	const recordBlocks = measurementBlocks.flatMap((block) => block.content);
	const cells: ReportCell[] = [];

	for (const record of recordBlocks) {
		for (const series of record.table?.data ?? []) {
			for (const point of series.points) {
				const resultId = point.metadata?.result_id;

				if (typeof resultId === 'number') {
					cells.push({ recordId: record.id, resultId });
				}
			}
		}
	}

	const toItem = (block: { id: string; label?: string | null }) => ({
		id: block.id,
		label: block.label ?? ''
	});

	return {
		runCase,
		runId: runCase.runId,
		configId: config.id,
		testBlocks: testBlocks.map(toItem),
		argValItems: argValBlocks.filter((block) => block.label.trim()).map(toItem),
		measurementItems: measurementBlocks.map(toItem),
		recordItems: recordBlocks.map(toItem),
		cells
	};
}

async function projectIdByName(
	request: APIRequestContext,
	name: string
): Promise<number | null> {
	const response = await request.get('/api/v2/projects/');
	expect(response.ok()).toBeTruthy();

	const payload = (await response.json()) as { id: number; name: string }[];

	return payload.find((project) => project.name === name)?.id ?? null;
}

async function dashboardResolvedDate(
	request: APIRequestContext,
	projectId?: number
): Promise<string | null> {
	const search = typeof projectId === 'number' ? `?project=${projectId}` : '';
	const response = await request.get(`/api/v2/dashboard/${search}`);
	expect(response.ok()).toBeTruthy();

	if (response.status() === 204) return null;

	const payload = (await response.json()) as { date?: string };

	return payload.date ?? null;
}

const QUERY_DELIMITER = ';';

function exactText(text: string): RegExp {
	return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

function badgeTextToPayload(text: string): string {
	const trimmed = text.trim();
	const at = trimmed.indexOf(': ');

	if (at <= 0) return trimmed;

	return `${trimmed.slice(0, at)}=${trimmed.slice(at + 2)}`;
}

export {
	QUERY_DELIMITER,
	badgeTextToPayload,
	exactText,
	dashboardCellDestination,
	dashboardResolvedDate,
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstReportConfig,
	firstResultNode,
	getTree,
	importedRunId,
	longLogNode,
	paginatedLogNode,
	projectIdByName,
	reportConfiguredImportedRun,
	reportFixture,
	representativeImportedRun
};

export type {
	ImportedRunCase,
	LogPagesNodeCase,
	ReportCell,
	ReportFixture,
	ReportItem,
	ResultNodeCase,
	TreeNode,
	TreeResponse
};
