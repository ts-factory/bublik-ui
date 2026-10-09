/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { requireCapability } from './capabilities';
import type { RULES_STATE_LABEL, RunIssueEffect } from './classification';
import type {
	Bundle,
	ClassificationIssue,
	ClassificationPin,
	ClassificationRule,
	E2EManifest
} from './manifest.gen';

/**
 * The classification the seed applied, resolved from the manifest's
 * `classification` section for the seeded scenario family.
 *
 * Scenarios name issues, rules and pins by their plan ids (`rx-timeout`,
 * `rx-timeout-1`, `rx-mode-timeout`), never by title or database id; this
 * module turns those into live ids, the bundles a pin landed in, and what the
 * library is expected to render for them. Manifests written before the plan
 * knew issue fixtures or rule activity (`fixture`, `active`, `projects`) are
 * read with the plan's defaults.
 */

type IssueState = 'open' | 'closed';
type RulesState = keyof typeof RULES_STATE_LABEL;

interface SeededRule {
	planId: string;
	ruleId: number;
	/** The plan id of the issue the rule belongs to. */
	issue: string;
	/** The plan id of the pin the rule was written against. */
	pin: string;
	category: ClassificationRule['category'];
	expected: boolean | null;
	match: ClassificationRule['match'];
	scope: ClassificationRule['scope'];
	/** Whether the rule is live now: not one-off, not deactivated, not under a closed issue. */
	active: boolean;
	/** What the rule does to a run's results, as the server's `effect` reports it. */
	effect: RunIssueEffect;
	/** Results the seed classified to create the rule. */
	classifiedResultIds: number[];
	/**
	 * The bundle those results are in: the only run the classify call stamped.
	 * Of the pin's `seededIn` bundles, the seed classifies in the first one the
	 * manifest lists (`_seeded_bundle()` in bublik-e2e), so the rest carry no
	 * stamp of the rule.
	 */
	classifiedIn: Bundle;
}

interface SeededIssue {
	planId: string;
	issueId: number;
	projectId: number;
	projectName: string;
	title: string;
	description: string | null;
	/** The bug key as stored, `ref://TRACKER/KEY`, or null. */
	key: string | null;
	state: IssueState;
	rulesState: RulesState;
	rules: SeededRule[];
}

interface SeededPin {
	planId: string;
	fixture: string;
	test: string;
	status: ClassificationPin['status'];
	unexpected: boolean;
	verdicts: string[];
	iterations: number[];
	/** The bundles the rules were written against. */
	seededIn: Bundle[];
	/** The bundles imported after the rules, which the rules stamp on import. */
	appliesTo: Bundle[];
}

interface SeededProject {
	name: string;
	projectId: number;
	issues: SeededIssue[];
}

interface SeededClassification {
	issues: SeededIssue[];
	rules: SeededRule[];
	pins: SeededPin[];
	issue(planId: string): SeededIssue;
	rule(planId: string): SeededRule;
	pin(planId: string): SeededPin;
	/** Every project that carries a seeded issue, by name. */
	projects(): SeededProject[];
}

/**
 * What a rule does to the results it stamps — `effect_for()` in the backend's
 * `core/classification.py`. A closed issue's rules are stale whatever their
 * disposition; activity does not enter into it.
 */
function ruleEffect(
	expected: boolean | null,
	issueState: IssueState
): RunIssueEffect {
	if (issueState === 'closed') return 'stale';
	if (expected === true) return 'suppressed';
	if (expected === false) return 'unexpected';

	return 'marked';
}

/** An issue's `rules_state` — `rules_state_for()` in the backend. */
function rulesStateFor(
	rules: readonly Pick<SeededRule, 'active'>[],
	issueState: IssueState
): RulesState {
	if (rules.length === 0) return 'unruled';
	if (rules.some((rule) => rule.active)) return 'enforced';

	return issueState === 'closed' ? 'deactivated' : 'dormant';
}

/**
 * Whether a seeded rule is live: a one-off rule is created inactive, a rule the
 * plan marks `active: false` is deactivated after creation, and closing an
 * issue deactivates all of its rules.
 */
function isRuleActive(
	rule: Pick<ClassificationRule, 'active' | 'scope'>,
	issueState: IssueState
): boolean {
	return (
		rule.scope !== 'oneoff' && (rule.active ?? true) && issueState === 'open'
	);
}

function lookup<T extends { planId: string }>(
	items: readonly T[],
	kind: string
): (planId: string) => T {
	const byId = new Map(items.map((item) => [item.planId, item]));

	return (planId) =>
		requireCapability(
			byId.get(planId),
			`the seeded classification has no ${kind} "${planId}"`
		);
}

/**
 * Reads the seeded classification out of `manifest`. Fails, through
 * `requireCapability`, when the stack was seeded without classification or a
 * plan id does not resolve, so a seeded scenario fails instead of skipping.
 */
function seededClassification(manifest: E2EManifest): SeededClassification {
	const section = requireCapability(
		manifest.classification,
		'the stack was seeded without classification (run the seed with E2E_CLASSIFY on)'
	);
	requireCapability(
		section.issues.length > 0,
		'the seeded classification has no issues'
	);

	const bundleById = new Map(
		manifest.bundles.map((bundle) => [bundle.id, bundle])
	);
	const projectByFixture = new Map(
		manifest.bundles.map((bundle) => [bundle.fixture, bundle.project])
	);
	const bundle = (id: string, pin: string) =>
		requireCapability(
			bundleById.get(id),
			`pin "${pin}" names bundle "${id}", which the manifest does not list`
		);

	const pins: SeededPin[] = section.pins.map((pin) => ({
		planId: pin.id,
		fixture: pin.fixture,
		test: pin.test,
		status: pin.status,
		unexpected: pin.unexpected,
		verdicts: pin.verdicts,
		iterations: pin.iterations,
		seededIn: pin.seededIn.map((id) => bundle(id, pin.id)),
		appliesTo: pin.appliesTo.map((id) => bundle(id, pin.id))
	}));
	const pin = lookup(pins, 'pin');

	const issueState = new Map<string, IssueState>(
		section.issues.map((issue) => [issue.id, issue.close ? 'closed' : 'open'])
	);
	const stateOf = (planId: string, rule: string): IssueState =>
		requireCapability(
			issueState.get(planId),
			`rule "${rule}" names issue "${planId}", which the plan does not declare`
		);

	const classifiedIn = (rule: ClassificationRule): Bundle =>
		requireCapability(
			manifest.bundles.find(
				(bundle) =>
					(bundle.importVia ?? 'api') === 'api' &&
					bundle.runId &&
					bundle.pinnedResults?.some((record) => record.pin === rule.pin)
			),
			`rule "${rule.id}" has no imported bundle its pin "${rule.pin}" landed in`
		);

	const rules: SeededRule[] = section.rules.map((rule) => {
		const state = stateOf(rule.issue, rule.id);
		pin(rule.pin);

		return {
			planId: rule.id,
			ruleId: requireCapability(
				rule.ruleId,
				`rule "${rule.id}" has no ruleId: --setup-classification did not create it`
			),
			issue: rule.issue,
			pin: rule.pin,
			category: rule.category,
			expected: rule.expected,
			match: rule.match,
			scope: rule.scope,
			active: isRuleActive(rule, state),
			effect: ruleEffect(rule.expected, state),
			classifiedResultIds: rule.classifiedResultIds ?? [],
			classifiedIn: classifiedIn(rule)
		};
	});

	const projectNameOf = (issue: ClassificationIssue, own: SeededRule[]) => {
		const fixture = issue.fixture ?? (own[0] && pin(own[0].pin).fixture);

		return requireCapability(
			issue.projectName ?? (fixture && projectByFixture.get(fixture)),
			`issue "${issue.id}" has no project: --setup-classification did not record it`
		);
	};

	const issues: SeededIssue[] = section.issues.map((issue) => {
		const own = rules.filter((rule) => rule.issue === issue.id);
		const state = stateOf(issue.id, issue.id);

		return {
			planId: issue.id,
			issueId: requireCapability(
				issue.issueId,
				`issue "${issue.id}" has no issueId: --setup-classification did not create it`
			),
			projectId: requireCapability(
				issue.projectId,
				`issue "${issue.id}" has no projectId: --setup-classification did not record it`
			),
			projectName: projectNameOf(issue, own),
			title: issue.title,
			description: issue.description,
			key: issue.key,
			state,
			rulesState: rulesStateFor(own, state),
			rules: own
		};
	});

	const projects = (): SeededProject[] => {
		const byName = new Map<string, SeededProject>();
		for (const issue of issues) {
			const project = byName.get(issue.projectName) ?? {
				name: issue.projectName,
				projectId: issue.projectId,
				issues: []
			};
			project.issues.push(issue);
			byName.set(issue.projectName, project);
		}

		return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
	};

	return {
		issues,
		rules,
		pins,
		issue: lookup(issues, 'issue'),
		rule: lookup(rules, 'rule'),
		pin,
		projects
	};
}

export { isRuleActive, ruleEffect, rulesStateFor, seededClassification };
export type {
	IssueState,
	RulesState,
	SeededClassification,
	SeededIssue,
	SeededPin,
	SeededProject,
	SeededRule
};
