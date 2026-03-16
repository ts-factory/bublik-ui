/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { APIRequestContext, expect, Page, test } from '@playwright/test';

import { BundleEntry, E2eManifest, ExpectedRun, SampleTest } from './manifest';
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
	bundle: BundleEntry;
	expectedRun: ExpectedRun;
	runId: number;
}

interface ResultNodeCase {
	runCase: ImportedRunCase;
	node: TreeNode;
}

interface ReportConfig {
	id: number;
	name: string;
}

function importedRunId(bundle: BundleEntry): number {
	if (!bundle.runId) {
		throw new Error(`Fixture run "${bundle.id}" has no imported runId.`);
	}
	return bundle.runId;
}

function representativeImportedRun(manifest: E2eManifest): ImportedRunCase {
	const { bundle, expectedRun } = representativeRun(manifest);
	return { bundle, expectedRun, runId: importedRunId(bundle) };
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
	sample: SampleTest
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
	manifest: E2eManifest
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
					if (node) return { runCase: { ...runCase, expectedRun }, node };
				}
			}
		}
	}

	return null;
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

function skipIfMissing<T>(value: T | null | undefined, reason: string): T {
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip(!value, reason);
	if (!value) throw new Error(reason);
	return value;
}

export {
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstReportConfig,
	firstResultNode,
	getTree,
	importedRunId,
	representativeImportedRun,
	skipIfMissing
};

export type { ImportedRunCase, ResultNodeCase, TreeNode, TreeResponse };
