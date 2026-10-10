/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { HistoryPage } from './pages/history-page';
import { IssuePicker } from './pages/issue-picker';
import { IssueRulesPage } from './pages/issue-rules-page';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { historyDateRange } from './support/sample-cases';
import {
	seededClassification,
	type SeededClassification
} from './support/seeded-classification';

const PICKER = { tag: ['@issues'] };
const PICKER_SEEDED = { tag: ['@issues', '@history', '@needs-classification'] };

/** A seeded pin whose test more than one seeded issue classifies. */
const SHARED_TEST_PIN = 'rx-mode-timeout';

/**
 * Projects the empty-state scenario records, to have one with no issue in
 * it, and deletes again. Scoped to the browser project, so one browser never
 * deletes another's project mid-scenario.
 */
function projectPrefix(): string {
	return `e2e project issue-picker ${test.info().project.name}`;
}

async function recordProject(request: APIRequestContext): Promise<{
	id: number;
	name: string;
}> {
	const name = `${projectPrefix()} ${Date.now().toString(36)}`;
	const response = await request.post('/api/v2/projects/', { data: { name } });
	expect(response.status(), await response.text()).toBe(201);

	return { id: ((await response.json()) as { id: number }).id, name };
}

async function sweepProjects(request: APIRequestContext): Promise<void> {
	const response = await request.get('/api/v2/projects/');
	if (!response.ok()) return;

	for (const project of (await response.json()) as {
		id: number;
		name: string;
	}[]) {
		if (!project.name.startsWith(`${projectPrefix()} `)) continue;

		await request.delete(`/api/v2/projects/${project.id}/`);
	}
}

/** Holds the picker's answers back until `release()` is called. */
async function holdPickerAnswers(page: Page): Promise<() => void> {
	let release!: () => void;
	const released = new Promise<void>((resolve) => {
		release = resolve;
	});

	await page.route(
		(url) => url.pathname.endsWith('/api/v2/issues/picker/'),
		async (route) => {
			await released;
			await route.continue();
		}
	);

	return release;
}

/** The test name a seeded project ran that no seeded rule is written for. */
function unclassifiedTest(plan: SeededClassification): {
	name: string;
	projectId: number;
} {
	const pin = plan.pin(SHARED_TEST_PIN);
	const project = requireCapability(
		plan
			.projects()
			.find((candidate) =>
				candidate.issues.some((issue) =>
					issue.rules.some((rule) => plan.pin(rule.pin).fixture === pin.fixture)
				)
			),
		`no seeded project runs the "${pin.fixture}" fixture`
	);
	const ruled = new Set(plan.pins.map((entry) => entry.test));
	const names = requireManifest()
		.bundles.filter((bundle) => bundle.fixture === pin.fixture)
		.flatMap((bundle) =>
			Object.values(bundle.expectedRuns[0]?.sampleTests ?? {}).flat()
		)
		.flatMap((sample) =>
			sample.name && !ruled.has(sample.name) ? [sample.name] : []
		)
		.sort();

	return {
		name: requireCapability(
			names[0],
			`every sampled test of "${pin.fixture}" has a seeded rule`
		),
		projectId: project.projectId
	};
}

async function openHistoryPicker(
	page: Page,
	testName: string,
	projectId: number
): Promise<IssuePicker> {
	const historyPage = new HistoryPage(page);

	await historyPage.gotoWithTestPath(testName, {
		...historyDateRange(requireManifest()),
		project: String(projectId)
	});
	await historyPage.openGlobalSearchForm();
	const picker = new IssuePicker(page, historyPage.globalSearchForm.root);
	await picker.open();

	return picker;
}

test.describe('Issue picker', () => {
	test.afterEach(async ({ request }) => {
		await sweepProjects(request);
	});

	test(
		'The issue picker says when it is searching, finds nothing or has no issues yet',
		PICKER,
		async ({ page, request }) => {
			const rulesPage = new IssueRulesPage(page);
			let project!: { id: number; name: string };
			let picker!: IssuePicker;
			let release!: () => void;

			await given('a project with no issues in it', async () => {
				project = await recordProject(request);
			});
			await and("the picker's answers are held back", async () => {
				release = await holdPickerAnswers(page);
			});
			await when(
				"I start a new rule in that project and open the rule's Issue picker",
				async () => {
					await rulesPage.goto();
					await rulesPage.expectLoaded();
					const drawer = await rulesPage.openNewRule();
					await drawer.selectProject(project.name);
					picker = new IssuePicker(page, drawer.root.getByTestId('rule-issue'));
					await picker.open();
				}
			);
			await then('the picker says it is searching', () =>
				picker.expectEmpty('Searching…')
			);
			await when('the answer arrives', () => release());
			await then('the picker says the project has no issues yet', () =>
				picker.expectEmpty('No issues yet — classify a result to create one')
			);
			await when('I type text no issue carries', () =>
				picker.type('nothing-carries-this')
			);
			await then('the picker says nothing matches', () =>
				picker.expectEmpty('No matches')
			);
			await and('I delete the project', async () => {
				await page.unrouteAll({ behavior: 'ignoreErrors' });
				await sweepProjects(request);
			});
		}
	);

	test(
		'The history issue picker says when no issue classifies the test',
		PICKER_SEEDED,
		async ({ page }) => {
			let unruled!: { name: string; projectId: number };
			let picker!: IssuePicker;

			await given(
				'a test of a seeded project that no seeded rule is written for',
				() => {
					unruled = unclassifiedTest(seededClassification(requireManifest()));
				}
			);
			await when(
				"I open the test's history, its search form and the Issue picker",
				async () => {
					picker = await openHistoryPicker(
						page,
						unruled.name,
						unruled.projectId
					);
				}
			);
			await then(
				'the picker says no issue classifies a result of the test',
				() =>
					picker.expectEmpty('No issue classifies a result of this test yet')
			);
		}
	);

	test(
		'The history issue picker lists only the issues that classify the test',
		PICKER_SEEDED,
		async ({ page }) => {
			const plan = seededClassification(requireManifest());
			let testName = '';
			let projectId = 0;
			let classifying: number[] = [];
			let picker!: IssuePicker;

			await given(
				'a test of a seeded project that several seeded issues classify',
				() => {
					const pin = plan.pin(SHARED_TEST_PIN);
					const issues = plan.issues.filter((issue) =>
						issue.rules.some((rule) => plan.pin(rule.pin).test === pin.test)
					);
					requireCapability(
						issues.length > 1,
						`only one seeded issue classifies "${pin.test}"`
					);
					requireCapability(
						plan.issues.some(
							(issue) =>
								issue.projectId === issues[0].projectId &&
								!issues.includes(issue)
						),
						`every seeded issue of the project classifies "${pin.test}"`
					);
					testName = pin.test;
					projectId = issues[0].projectId;
					classifying = issues.map((issue) => issue.issueId);
				}
			);
			await when(
				"I open the test's history, its search form and the Issue picker",
				async () => {
					picker = await openHistoryPicker(page, testName, projectId);
				}
			);
			await then(
				'exactly the issues that classify the test are offered, none of the project’s others',
				() => picker.expectOptions(classifying)
			);
		}
	);
});
