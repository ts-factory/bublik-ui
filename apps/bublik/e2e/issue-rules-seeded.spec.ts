/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { Page } from '@playwright/test';

import { IssueRulesPage } from './pages/issue-rules-page';
import type { IssueRulesUrlParam, ScopeChip } from './pages/issue-rules-page';
import { CATEGORY_BADGE, EFFECT_DISPLAY } from './support/classification';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { badgeTextToPayload } from './support/e2e-data';
import { requireManifest } from './support/manifest';
import {
	seededClassification,
	type IssueState,
	type SeededClassification,
	type SeededIssue,
	type SeededRule
} from './support/seeded-classification';

const SEEDED = { tag: ['@issues', '@needs-classification'] };

type Disposition = 'expected' | 'unexpected' | 'none';

/**
 * What the rules table's stripe reads for a rule, by its disposition and its
 * issue's state. An expected rule suppresses while the issue is open and counts
 * again once it is closed; an unexpected rule counts and an undecided one is
 * undecided whatever the issue's state.
 */
const STRIPE: Record<`${IssueState}:${Disposition}`, string> = {
	'open:expected': EFFECT_DISPLAY.suppressed,
	'closed:expected': EFFECT_DISPLAY.stale,
	'open:unexpected': EFFECT_DISPLAY.unexpected,
	'closed:unexpected': EFFECT_DISPLAY.unexpected,
	'open:none': EFFECT_DISPLAY.marked,
	'closed:none': EFFECT_DISPLAY.marked
};

function seeded(): SeededClassification {
	return seededClassification(requireManifest());
}

function dispositionOf(rule: Pick<SeededRule, 'expected'>): Disposition {
	if (rule.expected === true) return 'expected';
	if (rule.expected === false) return 'unexpected';

	return 'none';
}

function stateOf(plan: SeededClassification, rule: SeededRule): IssueState {
	return plan.issue(rule.issue).state;
}

function projectOf(plan: SeededClassification, rule: SeededRule): number {
	return plan.issue(rule.issue).projectId;
}

/** `rules`, bucketed by the project they live in. */
function byProject(
	plan: SeededClassification,
	rules: readonly SeededRule[]
): Map<number, SeededRule[]> {
	const buckets = new Map<number, SeededRule[]>();
	for (const rule of rules) {
		const projectId = projectOf(plan, rule);
		buckets.set(projectId, [...(buckets.get(projectId) ?? []), rule]);
	}

	return buckets;
}

async function openProjectRules(
	rulesPage: IssueRulesPage,
	projectId: number,
	params: Record<string, string> = {}
): Promise<void> {
	await rulesPage.goto({ project: String(projectId), ...params });
	await rulesPage.expectLoaded();
}

/** What the Disposition filter and badge call each disposition. */
const DISPOSITION_LABEL: Record<Disposition, string> = {
	expected: 'Expected',
	unexpected: 'Unexpected',
	none: 'Marked'
};

/** The seeded rules of `rule`'s project other than `rule` itself. */
function neighbours(
	plan: SeededClassification,
	rule: SeededRule
): SeededRule[] {
	const projectId = projectOf(plan, rule);

	return plan.rules.filter(
		(other) => other !== rule && projectOf(plan, other) === projectId
	);
}

type Facet = 'Category' | 'Disposition' | 'Parameters' | 'Verdicts' | 'Tags';

/** The value a facet case picks: how the facet lists it and how the URL holds it. */
interface FacetValue {
	label: string;
	/** What a row shows for it: the badge or chip text. */
	shown: string;
	param: IssueRulesUrlParam;
	urlValue: string;
	/** Repeated params hold one value each; the others are `;`-joined. */
	repeated: boolean;
}

interface FacetCase {
	/** The hidden column that shows the value on every row, if it is hidden. */
	column?: Facet;
	/** Reads the value off `rule` — from the plan, or from its Match Scope card. */
	value(
		plan: SeededClassification,
		rule: SeededRule,
		rulesPage: IssueRulesPage
	): Promise<FacetValue>;
	/**
	 * Whether another seeded rule carries the value — known from the plan for
	 * categories, dispositions and verdicts; for parameters and tags the plan
	 * only knows whether the rule matches on them at all.
	 */
	lacks(
		plan: SeededClassification,
		rule: SeededRule,
		other: SeededRule
	): boolean;
}

async function scopeValue(
	rulesPage: IssueRulesPage,
	rule: SeededRule,
	chip: 'Params' | 'Tags',
	param: IssueRulesUrlParam
): Promise<FacetValue> {
	const [shown] = await rulesPage.scopeValues(
		rulesPage.rowById(rule.ruleId),
		chip
	);
	const label = requireCapability(
		shown,
		`rule has no ${chip} in its Match Scope card`
	);

	return {
		label,
		shown: label,
		param,
		urlValue: badgeTextToPayload(label),
		repeated: true
	};
}

const FACET_CASES: Record<Facet, FacetCase> = {
	Category: {
		value: async (_plan, rule) => ({
			label: CATEGORY_BADGE[rule.category],
			shown: CATEGORY_BADGE[rule.category],
			param: 'category',
			urlValue: rule.category,
			repeated: false
		}),
		lacks: (_plan, rule, other) => other.category !== rule.category
	},
	Disposition: {
		column: 'Disposition',
		value: async (_plan, rule) => ({
			label: DISPOSITION_LABEL[dispositionOf(rule)],
			shown: DISPOSITION_LABEL[dispositionOf(rule)],
			param: 'disposition',
			urlValue: dispositionOf(rule),
			repeated: false
		}),
		lacks: (_plan, rule, other) => other.expected !== rule.expected
	},
	Parameters: {
		column: 'Parameters',
		value: (_plan, rule, rulesPage) =>
			scopeValue(rulesPage, rule, 'Params', 'parameters'),
		lacks: (_plan, _rule, other) => !other.match.includes('parameters')
	},
	Verdicts: {
		column: 'Verdicts',
		value: async (plan, rule) => {
			const verdict = requireCapability(
				plan.pin(rule.pin).verdicts[0],
				`the pin of rule "${rule.planId}" has no verdict`
			);

			return {
				label: verdict,
				// A chip shows the verdict without its leading spaces.
				shown: verdict.trim(),
				param: 'verdicts',
				urlValue: verdict,
				repeated: true
			};
		},
		lacks: (plan, rule, other) =>
			!other.match.includes('verdicts') ||
			!plan.pin(other.pin).verdicts.includes(plan.pin(rule.pin).verdicts[0])
	},
	Tags: {
		column: 'Tags',
		value: (_plan, rule, rulesPage) =>
			scopeValue(rulesPage, rule, 'Tags', 'tags'),
		lacks: (_plan, _rule, other) => !other.match.includes('tags')
	}
};

async function expectFacetNarrows(
	page: Page,
	facet: Facet,
	planId: string
): Promise<void> {
	const rulesPage = new IssueRulesPage(page);
	const plan = seeded();
	const facetCase = FACET_CASES[facet];
	let rule!: SeededRule;
	let without!: SeededRule[];
	let value!: FacetValue;

	await given(
		'a seeded rule and the seeded rules of its project that do not carry its value for the facet',
		() => {
			rule = plan.rule(planId);
			without = neighbours(plan, rule).filter((other) =>
				facetCase.lacks(plan, rule, other)
			);
			requireCapability(
				without.length > 0 || null,
				`every seeded rule beside "${planId}" carries its ${facet} value`
			);
		}
	);
	await when(
		"I open the rules page for its project and pick the rule's value in the facet",
		async () => {
			await openProjectRules(rulesPage, projectOf(plan, rule));
			value = await facetCase.value(plan, rule, rulesPage);
			await rulesPage.table.toggleFacet(facet, value.label);
		}
	);
	await then('the value is written to the URL', () =>
		value.repeated
			? rulesPage.expectRepeatedParam(value.param, [value.urlValue])
			: rulesPage.expectParams({ [value.param]: value.urlValue })
	);
	await and(
		'the rule is listed and the seeded rules without that value are gone',
		async () => {
			await rulesPage.expectRuleListed(rulesPage.rowById(rule.ruleId));
			for (const other of without) {
				await rulesPage.table.expectRowGone(rulesPage.rowById(other.ruleId));
			}
		}
	);
	await and('every listed rule shows that value', async () => {
		if (facetCase.column) await rulesPage.table.toggleColumn(facetCase.column);
		await rulesPage.expectEveryRuleShows(value.shown);
	});
}

async function expectChipToggles(
	page: Page,
	facet: 'Parameters' | 'Verdicts' | 'Tags',
	planId: string
): Promise<void> {
	const rulesPage = new IssueRulesPage(page);
	const plan = seeded();
	const facetCase = FACET_CASES[facet];
	let rule!: SeededRule;
	let other!: SeededRule;
	let value!: FacetValue;

	await given(
		"a seeded rule that matches on the chip's kind and a seeded rule of its project that does not",
		() => {
			rule = plan.rule(planId);
			other = requireCapability(
				neighbours(plan, rule).find((candidate) =>
					facetCase.lacks(plan, rule, candidate)
				),
				`every seeded rule beside "${planId}" carries its ${facet} value`
			);
		}
	);
	await when(
		"I open the rules page for its project, turn the chip's column on and click the rule's chip",
		async () => {
			await openProjectRules(rulesPage, projectOf(plan, rule));
			value = await facetCase.value(plan, rule, rulesPage);
			await rulesPage.table.toggleColumn(facet);
			await rulesPage.table.expectColumnShown(facet);
			await rulesPage
				.matcherChip(rulesPage.rowById(rule.ruleId), value.shown)
				.click();
		}
	);
	await then(
		"the chip's value is written to the URL once, exactly as the rule holds it",
		() => rulesPage.expectRepeatedParam(value.param, [value.urlValue])
	);
	await and('the rule is still listed and the other rule is gone', async () => {
		await rulesPage.expectRuleListed(rulesPage.rowById(rule.ruleId));
		await rulesPage.table.expectRowGone(rulesPage.rowById(other.ruleId));
	});
	await when('I click the chip again', () =>
		rulesPage.matcherChip(rulesPage.rowById(rule.ruleId), value.shown).click()
	);
	await then(
		'the value is cleared from the URL and the other rule is listed again',
		async () => {
			await rulesPage.expectRepeatedParam(value.param, []);
			await rulesPage.expectRuleListed(rulesPage.rowById(other.ruleId));
		}
	);
}

type MatchPart = SeededRule['match'][number];

/**
 * The match shapes the seed writes, and the Match Scope chips each one reads:
 * Path always, then one chip per part the rule matches on.
 */
const SHAPES: { name: string; match: MatchPart[]; chips: ScopeChip[] }[] = [
	{ name: 'path-only', match: [], chips: ['Path'] },
	{ name: 'parameter', match: ['parameters'], chips: ['Path', 'Params'] },
	{ name: 'verdict', match: ['verdicts'], chips: ['Path', 'Verdicts'] },
	{ name: 'tag', match: ['tags'], chips: ['Path', 'Tags'] },
	{
		name: 'combined',
		match: ['parameters', 'verdicts'],
		chips: ['Path', 'Params', 'Verdicts']
	}
];

function hasShape(rule: SeededRule, match: readonly MatchPart[]): boolean {
	return (
		rule.match.length === match.length &&
		match.every((part) => rule.match.includes(part))
	);
}

test.describe('Issue Rules Page against seeded classification', () => {
	test(
		"Each seeded rule's stripe shows its disposition under its issue's state",
		SEEDED,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			let picked!: SeededRule[];

			await given(
				'the seed wrote rules of every disposition under open and closed issues',
				() => {
					// One rule per disposition and issue state the plan carries.
					const byCase = new Map<string, SeededRule>();
					for (const rule of plan.rules) {
						const key = `${stateOf(plan, rule)}:${dispositionOf(rule)}`;
						if (!byCase.has(key)) byCase.set(key, rule);
					}
					picked = [...byCase.values()];
				}
			);
			await then(
				"on its project's rules page each rule's stripe reads what its disposition does under its issue's state",
				async () => {
					for (const [projectId, rules] of byProject(plan, picked)) {
						await openProjectRules(rulesPage, projectId);
						for (const rule of rules) {
							const row = rulesPage.rowById(rule.ruleId);
							await rulesPage.expectRuleListed(row);
							await rulesPage.expectStripe(
								row,
								STRIPE[`${stateOf(plan, rule)}:${dispositionOf(rule)}`],
								{ muted: !rule.active }
							);
						}
					}
				}
			);
			await and('the four stripe colours are all among them', () => {
				const shown = new Set(
					picked.map(
						(rule) => STRIPE[`${stateOf(plan, rule)}:${dispositionOf(rule)}`]
					)
				);
				for (const status of Object.values(EFFECT_DISPLAY)) {
					requireCapability(
						shown.has(status) || null,
						`no seeded rule shows the "${status}" stripe`
					);
				}
			});
		}
	);

	test(
		'Inactive seeded rules show a muted stripe and read Inactive',
		SEEDED,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			let inactive!: SeededRule[];
			let active!: SeededRule;

			await given(
				'the seed left a one-off rule, a deactivated rule of an open issue and a rule of a closed issue',
				() => {
					const find = (
						why: string,
						predicate: (rule: SeededRule) => boolean
					) =>
						requireCapability(
							plan.rules.find((rule) => !rule.active && predicate(rule)),
							`the seed left no inactive rule that is ${why}`
						);

					inactive = [
						find('one-off', (rule) => rule.scope === 'oneoff'),
						find(
							'deactivated under an open issue',
							(rule) =>
								rule.scope !== 'oneoff' && stateOf(plan, rule) === 'open'
						),
						find(
							'under a closed issue',
							(rule) => stateOf(plan, rule) === 'closed'
						)
					];
				}
			);
			await and('an active rule beside them', () => {
				const projectId = projectOf(plan, inactive[0]);
				active = requireCapability(
					plan.rules.find(
						(rule) => rule.active && projectOf(plan, rule) === projectId
					),
					'the seed left no active rule beside the inactive ones'
				);
			});
			await then(
				"on its project's rules page each inactive rule's stripe is muted and its Active badge reads Inactive",
				async () => {
					for (const [projectId, rules] of byProject(plan, inactive)) {
						await openProjectRules(rulesPage, projectId);
						for (const rule of rules) {
							const row = rulesPage.rowById(rule.ruleId);
							await rulesPage.expectRuleListed(row);
							await rulesPage.expectMuted(row, true);
							await rulesPage.expectActiveBadge(row, 'Inactive');
						}
					}
				}
			);
			await and(
				'hovering the muted stripe explains that the rule is inactive',
				async () => {
					const [rule] = inactive;
					await openProjectRules(rulesPage, projectOf(plan, rule));
					await rulesPage.expectStripeTooltip(
						rulesPage.rowById(rule.ruleId),
						/^Inactive — /
					);
				}
			);
			await and(
				"the active rule's stripe is not muted and its badge reads Active",
				async () => {
					await openProjectRules(rulesPage, projectOf(plan, active));
					const row = rulesPage.rowById(active.ruleId);
					await rulesPage.expectRuleListed(row);
					await rulesPage.expectMuted(row, false);
					await rulesPage.expectActiveBadge(row, 'Active');
				}
			);
		}
	);

	test.describe('A rule facet keeps only the seeded rules that carry the picked value', () => {
		const FACET = { tag: ['@issues', '@needs-classification', '@url-params'] };

		test('Category', FACET, ({ page }) =>
			expectFacetNarrows(page, 'Category', 'rx-timeout-3')
		);

		test('Disposition', FACET, ({ page }) =>
			expectFacetNarrows(page, 'Disposition', 'csum-corruption-2')
		);

		test('Parameters', FACET, ({ page }) =>
			expectFacetNarrows(page, 'Parameters', 'csum-corruption-1')
		);

		test('Verdicts', FACET, ({ page }) =>
			expectFacetNarrows(page, 'Verdicts', 'mtu-tcp-frag-1')
		);

		test('Tags', FACET, ({ page }) =>
			expectFacetNarrows(page, 'Tags', 'rx-timeout-3')
		);
	});

	test.describe('A matcher chip of a seeded rule toggles its filter', () => {
		const CHIP = { tag: ['@issues', '@needs-classification', '@url-params'] };

		test('Parameter chip', CHIP, ({ page }) =>
			expectChipToggles(page, 'Parameters', 'csum-corruption-1')
		);

		test('Tag chip', CHIP, ({ page }) =>
			expectChipToggles(page, 'Tags', 'rx-timeout-3')
		);

		test('Verdict chip with a semicolon', CHIP, ({ page }) =>
			expectChipToggles(page, 'Verdicts', 'carrier-lost-1')
		);
	});

	test(
		"The Match Scope chips name each seeded rule's match shape",
		SEEDED,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			let shaped!: { rule: SeededRule; chips: ScopeChip[] }[];

			await given(
				'the seed wrote path-only, parameter, verdict, tag and combined rules',
				() => {
					shaped = SHAPES.map(({ name, match, chips }) => ({
						rule: requireCapability(
							plan.rules.find((rule) => hasShape(rule, match)),
							`the seed wrote no ${name} rule`
						),
						chips
					}));
				}
			);
			await then(
				"on its project's rules page each rule's Match Scope shows exactly the chips of its shape",
				async () => {
					const projectIds = new Set(
						shaped.map(({ rule }) => projectOf(plan, rule))
					);
					for (const projectId of projectIds) {
						await openProjectRules(rulesPage, projectId);
						for (const { rule, chips } of shaped) {
							if (projectOf(plan, rule) !== projectId) continue;
							const row = rulesPage.rowById(rule.ruleId);
							await rulesPage.expectRuleListed(row);
							await rulesPage.expectScopeChipsExactly(row, chips);
						}
					}
				}
			);
			await and(
				"hovering a combined rule's Verdicts chip lists the verdict it matches",
				async () => {
					const combined = shaped[shaped.length - 1].rule;
					const verdict = plan.pin(combined.pin).verdicts[0];
					const row = rulesPage.rowById(combined.ruleId);

					await openProjectRules(rulesPage, projectOf(plan, combined));
					await rulesPage.hoverScopeChip(row, 'Verdicts');
					await rulesPage.expectScopeHoverCardTitled('Verdicts');
					await rulesPage.expectScopeHoverCardLists(verdict);
				}
			);
		}
	);

	test(
		'The issue state filter hides the rules of closed issues',
		{ tag: ['@issues', '@needs-classification', '@url-params'] },
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			let closed!: SeededIssue;
			let open!: SeededIssue;
			const rows = (issue: SeededIssue) =>
				issue.rules.map((rule) => rulesPage.rowById(rule.ruleId));
			const expectListed = async (issue: SeededIssue) => {
				for (const row of rows(issue)) await rulesPage.expectRuleListed(row);
			};
			const expectGone = async (issue: SeededIssue) => {
				for (const row of rows(issue)) await rulesPage.table.expectRowGone(row);
			};

			await given(
				'the seed closed an issue with rules and left another issue of its project open',
				() => {
					closed = requireCapability(
						plan.issues.find(
							(issue) => issue.state === 'closed' && issue.rules.length > 0
						),
						'the seed closed no issue with rules'
					);
					open = requireCapability(
						plan.issues.find(
							(issue) =>
								issue.state === 'open' &&
								issue.projectId === closed.projectId &&
								issue.rules.length > 0
						),
						'the seed left no open issue with rules beside the closed one'
					);
				}
			);
			await when('I open the rules page for their project', () =>
				openProjectRules(rulesPage, closed.projectId)
			);
			await then('the rules of both issues are listed', async () => {
				await expectListed(open);
				await expectListed(closed);
			});
			await when('I pick Open in the State filter', () =>
				rulesPage.table.toggleFacet('State', 'Open')
			);
			await then(
				"the issue state is written to the URL and only the open issue's rules are listed",
				async () => {
					await rulesPage.expectParams({ issueState: 'open' });
					await expectGone(closed);
					await expectListed(open);
				}
			);
			await when("I click the state badge of the open issue's rule", () =>
				rulesPage.issueStateBadge(rows(open)[0]).click()
			);
			await then(
				"the issue state is cleared from the URL and the closed issue's rules are listed again",
				async () => {
					await rulesPage.expectParams({ issueState: null });
					await expectListed(closed);
				}
			);
			await when('I pick Closed in the State filter', () =>
				rulesPage.table.toggleFacet('State', 'Closed')
			);
			await then("only the closed issue's rules are listed", async () => {
				await rulesPage.expectParams({ issueState: 'closed' });
				await expectGone(open);
				await expectListed(closed);
			});
		}
	);

	test(
		'Seeded rules page ten at a time',
		{ tag: ['@issues', '@needs-classification', '@url-params'] },
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			const PAGE_SIZE = 10;
			let projectId!: number;
			let ruleIds!: number[];
			const pages: number[][] = [];

			await given('a project with more than ten seeded rules', () => {
				const [widest, rules] = [...byProject(plan, plan.rules)].reduce(
					(best, candidate) =>
						candidate[1].length > best[1].length ? candidate : best
				);
				requireCapability(
					rules.length > PAGE_SIZE || null,
					`no project carries more than ${PAGE_SIZE} seeded rules`
				);
				projectId = widest;
				ruleIds = rules.map((rule) => rule.ruleId);
			});
			await when('I open its rules page ten rules to a page', () =>
				openProjectRules(rulesPage, projectId, { pageSize: String(PAGE_SIZE) })
			);
			await then(
				'the first page lists ten rules and the Rows per page select reads 10',
				async () => {
					await rulesPage.expectRuleCount(PAGE_SIZE);
					await rulesPage.expectRowsPerPage(PAGE_SIZE);
					pages.push(await rulesPage.ruleIdsOnPage());
				}
			);
			await when('I page forward to the last page', async () => {
				while (await rulesPage.hasNextPage()) {
					const previous = pages[pages.length - 1];
					await rulesPage.openNextPage();
					await rulesPage.expectParams({ page: String(pages.length + 1) });
					pages.push(await rulesPage.ruleIdsOnPageOtherThan(previous));
				}
			});
			await then(
				'each later page is written to the URL and lists at most ten rules',
				() => {
					requireCapability(
						pages.length > 1 || null,
						'the rules fit on one page of ten'
					);
					for (const ids of pages) {
						expect(ids.length).toBeGreaterThan(0);
						expect(ids.length).toBeLessThanOrEqual(PAGE_SIZE);
					}
				}
			);
			await and('no rule is listed on two pages', () => {
				const listed = pages.flat();
				expect(new Set(listed).size).toBe(listed.length);
			});
			await and(
				'every seeded rule of the project was listed on one of the pages',
				() => {
					const listed = new Set(pages.flat());
					expect(ruleIds.filter((id) => !listed.has(id))).toEqual([]);
				}
			);
		}
	);

	test(
		"A project group's New Rule button opens the drawer with that project set",
		SEEDED,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const plan = seeded();
			let projects!: { projectId: number; name: string }[];

			await given('the seed wrote rules in several projects', () => {
				projects = plan
					.projects()
					.filter((project) =>
						project.issues.some((issue) => issue.rules.length > 0)
					);
				requireCapability(
					projects.length > 1 || null,
					'the seed wrote rules in a single project'
				);
			});
			await when('I open the rules page for every project', async () => {
				await rulesPage.goto({ pageSize: '100' });
				await rulesPage.expectLoaded();
			});
			await then('each of those projects heads a group of rules', async () => {
				for (const { projectId, name } of projects) {
					await rulesPage.table.expectGroupHeading(projectId, {
						name,
						atLeast: 1
					});
				}
			});
			await and(
				"each group's New Rule button opens the New Rule drawer with that project set",
				async () => {
					for (const { projectId, name } of projects) {
						const drawer = await rulesPage.openNewRuleInGroup(projectId);
						await drawer.expectProject(name);
						await drawer.close();
					}
				}
			);
		}
	);
});
