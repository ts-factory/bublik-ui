/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import type {
	Bundle,
	E2EManifest,
	ExpectedRun,
	IterationEntry
} from './manifest';
import { representativeRun } from './sample-cases';

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
	/** Set when the node was located from a manifest sample (measurements). */
	sample?: IterationEntry;
}

interface ReportConfig {
	id: number;
	name: string;
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

function findSampleNode(
	tree: TreeResponse,
	sample: IterationEntry
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

/**
 * Which page a dashboard counter opens is deployment configuration: the backend
 * attaches a handler per column (`go_run`, `go_log`, ...) and the cell payload
 * carries the resulting `url` kind. Resolve it from the API so scenarios assert
 * the mapping the UI performs instead of one deployment's column layout.
 */
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

export {
	dashboardCellDestination,
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstReportConfig,
	firstResultNode,
	getTree,
	importedRunId,
	reportConfiguredImportedRun,
	representativeImportedRun
};

export type { ImportedRunCase, ResultNodeCase, TreeNode, TreeResponse };
