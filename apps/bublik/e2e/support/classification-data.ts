/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { requireCapability } from './capabilities';
import type { Bundle, E2EManifest } from './manifest';
import {
	seededClassification,
	type SeededIssue,
	type SeededRule
} from './seeded-classification';

/**
 * Picks for the URL-contract scenarios of the classification pages, made from
 * the seeded classification (`seededClassification()`): the project whose
 * lists are long enough to page and filter, two projects to show a scope
 * excluding the other, an issue with rules, the runs the seeded rules
 * classified. Selected by what the plan seeded, never by title or database
 * id, and read-only, like every scenario of the seeded family.
 */

interface SeededProject {
	projectId: number;
	projectName: string;
	issues: SeededIssue[];
}

interface ClassifiedRunCase {
	bundle: Bundle;
	runId: number;
	projectId: number;
	projectName: string;
	/** The seeded issues whose rules classified results in this run. */
	issues: SeededIssue[];
	/** The categories of the rules that did the classifying. */
	categories: SeededRule['category'][];
}

/** The projects the plan seeded issues into, most issues first. */
function seededProjects(manifest: E2EManifest): SeededProject[] {
	return seededClassification(manifest)
		.projects()
		.map((project) => ({
			projectId: project.projectId,
			projectName: project.name,
			issues: project.issues
		}))
		.sort((a, b) => b.issues.length - a.issues.length);
}

/**
 * The project with the most seeded issues: the one whose list is long enough
 * to page, filter and sort against.
 */
function richestProject(manifest: E2EManifest): SeededProject {
	return requireCapability(
		seededProjects(manifest)[0],
		'the seeded classification has no project with issues'
	);
}

/**
 * Two projects that both have seeded issues, so a project scope can be shown
 * to exclude the other one's issues.
 */
function projectPairWithIssues(manifest: E2EManifest): {
	selected: SeededProject;
	other: SeededProject;
} {
	const [selected, other] = seededProjects(manifest);

	return {
		selected: requireCapability(
			selected,
			'the seeded classification has no project with issues'
		),
		other: requireCapability(
			other,
			'the seeded classification has issues in one project only'
		)
	};
}

function issueByState(
	manifest: E2EManifest,
	state: SeededIssue['state'],
	projectId?: number
): SeededIssue {
	return requireCapability(
		seededClassification(manifest).issues.find(
			(issue) =>
				issue.state === state &&
				(projectId === undefined || issue.projectId === projectId)
		),
		`the seeded classification has no ${state} issue${
			projectId === undefined ? '' : ` in project ${projectId}`
		}`
	);
}

/** An open issue that has several rules, so its detail page lists them. */
function issueWithRules(manifest: E2EManifest, minRules = 2): SeededIssue {
	return requireCapability(
		seededClassification(manifest)
			.issues.filter((issue) => issue.state === 'open')
			.sort((a, b) => b.rules.length - a.rules.length)
			.find((issue) => issue.rules.length >= minRules),
		`the seeded classification has no open issue with ${minRules} rules`
	);
}

/** The test a seeded rule was written against: its pin's. */
function testOfRule(manifest: E2EManifest, rule: SeededRule): string {
	return seededClassification(manifest).pin(rule.pin).test;
}

/**
 * The imported runs whose results a seeded rule classified: the bundles its
 * pin was seeded in or that the rule was applied to on import. Most issues
 * first.
 */
function classifiedRuns(manifest: E2EManifest): ClassifiedRunCase[] {
	const seeded = seededClassification(manifest);
	const byBundle = new Map<
		string,
		{
			bundle: Bundle & { runId: number };
			issues: Map<number, SeededIssue>;
			categories: Set<SeededRule['category']>;
		}
	>();

	for (const rule of seeded.rules) {
		const pin = seeded.pin(rule.pin);
		const issue = seeded.issue(rule.issue);

		for (const bundle of [...pin.seededIn, ...pin.appliesTo]) {
			const { runId } = bundle;
			if (!runId) continue;

			const entry = byBundle.get(bundle.id) ?? {
				bundle: { ...bundle, runId },
				issues: new Map(),
				categories: new Set()
			};

			entry.issues.set(issue.issueId, issue);
			entry.categories.add(rule.category);
			byBundle.set(bundle.id, entry);
		}
	}

	return [...byBundle.values()]
		.map(({ bundle, issues, categories }) => {
			const [first] = issues.values();

			return {
				bundle,
				runId: bundle.runId,
				projectId: first.projectId,
				projectName: first.projectName,
				issues: [...issues.values()],
				categories: [...categories]
			};
		})
		.sort((a, b) => b.issues.length - a.issues.length);
}

/** The run with the most classified issues, for the run issues page. */
function richestClassifiedRun(manifest: E2EManifest): ClassifiedRunCase {
	return requireCapability(
		classifiedRuns(manifest)[0],
		'the seeded classification classified no imported run'
	);
}

/** The facet label of each rule category, as the Category filter lists it. */
const CATEGORY_LABELS: Record<SeededRule['category'], string> = {
	'product-defect': 'Product defect',
	'test-bug': 'Test/automation bug',
	env: 'Environment / infra',
	'known-issue': 'Known issue',
	flaky: 'Flaky / intermittent',
	'to-investigate': 'To investigate'
};

/** The ids the instance gave an issue's seeded rules. */
function seededRuleIds(issue: SeededIssue): number[] {
	return issue.rules.map((rule) => rule.ruleId);
}

export {
	CATEGORY_LABELS,
	issueByState,
	issueWithRules,
	projectPairWithIssues,
	richestClassifiedRun,
	richestProject,
	seededRuleIds,
	testOfRule
};
export type { ClassifiedRunCase, SeededIssue, SeededProject };
