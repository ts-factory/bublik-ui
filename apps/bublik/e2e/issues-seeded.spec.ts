/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { test } from './support/test';

import type { IssueDrawer } from './pages/issue-drawer';
import { IssuesPage } from './pages/issues-page';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { CATEGORY_BADGE, type IssueCategory } from './support/classification';
import { requireManifest } from './support/manifest';
import {
	seededClassification,
	type RulesState,
	type SeededIssue,
	type SeededProject
} from './support/seeded-classification';

const SEEDED = { tag: ['@issues', '@needs-classification'] };

const GITEA = 'https://gitea.home.limonikas.ru/limonikas/bublik-ui/issues';

/** A seeded issue's bug key as the Key column shows it, and where it links out to. */
interface ShownKey {
	issue: SeededIssue;
	text: string;
	href: string | null;
}

/**
 * Where each seeded issue's key points: `ref://TRACKER/KEY` links to the
 * tracker's URI plus the key when its project configures that tracker, and to
 * nothing otherwise; an issue with no key shows its `#id` instead.
 */
function shownKeys(): ShownKey[] {
	const manifest = requireManifest();
	const projects = requireCapability(
		manifest.projects,
		'the manifest records no project tracker configuration'
	);

	return seededClassification(manifest).issues.map((issue) => {
		if (!issue.key) {
			return { issue, text: `#${issue.issueId}`, href: null };
		}
		const [, tracker, key] = requireCapability(
			/^ref:\/\/([^/]+)\/(.+)$/.exec(issue.key),
			`issue "${issue.planId}" has a key not in ref://TRACKER/KEY form`
		);
		const configured = projects
			.find((project) => project.name === issue.projectName)
			?.trackers.find((candidate) => candidate.id === tracker);

		return {
			issue,
			text: key,
			href: configured ? `${configured.uri}${key}` : null
		};
	});
}

/**
 * Seeded issues by the categories of their active rules: the issues table
 * files an issue only under the categories its rules in force carry, so an
 * issue whose rules are all inactive is under none.
 */
function issuesByActiveCategory(
	issues: readonly SeededIssue[]
): Map<IssueCategory, SeededIssue[]> {
	const byCategory = new Map<IssueCategory, SeededIssue[]>();
	for (const issue of issues) {
		const categories = new Set(
			issue.rules.filter((rule) => rule.active).map((rule) => rule.category)
		);
		for (const category of categories) {
			byCategory.set(category, [...(byCategory.get(category) ?? []), issue]);
		}
	}

	return byCategory;
}

/**
 * A line of a markdown description as it reads once rendered: without its
 * list or heading marker, emphasis or code ticks. Only a line's own text is
 * compared, so it does not matter where the renderer wraps it.
 */
function renderedLine(line: string): string {
	return line
		.replace(/^\s*(?:[-*]|#{1,6})\s+/, '')
		.replace(/\*\*|`/g, '')
		.trim();
}

/** The lines of `description` that hold text, rendered. */
function textLines(description: string): string[] {
	return description
		.split('\n')
		.filter((line) => line.trim() && !/^ {4}/.test(line))
		.map(renderedLine);
}

const RULES_STATES: readonly RulesState[] = [
	'enforced',
	'dormant',
	'deactivated',
	'unruled'
];

/** What the Rules badge of a seeded issue reads: "{active} of {total} active", or the state when it has none. */
function rulesBadgeText(issue: SeededIssue): string | undefined {
	if (issue.rules.length === 0) return undefined;
	const active = issue.rules.filter((rule) => rule.active).length;

	return `${active} of ${issue.rules.length} active`;
}

test.describe('Issues Page against seeded classification', () => {
	test(
		'Every seeded issue of a project is listed under its project group',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let project!: SeededProject;

			await given('the seed recorded several issues in one project', () => {
				// The project with the most seeded issues: the widest group to check.
				const projects = seededClassification(requireManifest()).projects();
				project = projects.reduce((widest, candidate) =>
					candidate.issues.length > widest.issues.length ? candidate : widest
				);
			});
			await when('I open the issues page for every project', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				"each of those issues is listed under that project's group",
				async () => {
					for (const issue of project.issues) {
						await issuesPage.expectIssueInGroup(
							issue.issueId,
							project.projectId
						);
					}
				}
			);
			await and(
				"the group's heading names the project and counts at least those issues",
				() =>
					issuesPage.table.expectGroupHeading(project.projectId, {
						name: project.name,
						atLeast: project.issues.length
					})
			);
		}
	);

	test(
		'Every rules state shows its own stripe and Rules badge',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let issues!: SeededIssue[];

			await given(
				'the seed recorded an issue in each of the four rules states',
				() => {
					const seeded = seededClassification(requireManifest());
					issues = RULES_STATES.map((state) =>
						requireCapability(
							seeded.issues.find((issue) => issue.rulesState === state),
							`the seeded classification has no issue whose rules are ${state}`
						)
					);
				}
			);
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				"each issue's stripe and Rules badge name its rules state",
				async () => {
					for (const issue of issues) {
						await issuesPage.expectRulesStateOf(
							issue.issueId,
							issue.rulesState,
							rulesBadgeText(issue)
						);
					}
				}
			);
		}
	);

	test(
		'The Category filter counts and narrows to the seeded categories',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let byCategory!: Map<IssueCategory, SeededIssue[]>;
			let others!: SeededIssue[];
			let narrowest!: IssueCategory;

			await given('the seed filed issues under every category', () => {
				const { issues } = seededClassification(requireManifest());
				byCategory = issuesByActiveCategory(issues);
				for (const category of Object.keys(CATEGORY_BADGE)) {
					requireCapability(
						byCategory.get(category as IssueCategory)?.length,
						`no seeded issue has an active ${category} rule`
					);
				}
				narrowest = [...byCategory.entries()].reduce((a, b) =>
					b[1].length < a[1].length ? b : a
				)[0];
				const inside = new Set(byCategory.get(narrowest));
				others = issues.filter((issue) => !inside.has(issue));
			});
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				'each Category option counts at least the seeded issues filed under it',
				async () => {
					for (const [category, issues] of byCategory) {
						await issuesPage.expectFacetCountAtLeast(
							'Category',
							CATEGORY_BADGE[category],
							issues.length
						);
					}
				}
			);
			await when('I filter by the category with the fewest seeded issues', () =>
				issuesPage.table.toggleFacet('Category', CATEGORY_BADGE[narrowest])
			);
			await then(
				'every seeded issue filed under it is listed and no other seeded issue is',
				async () => {
					await issuesPage.expectParams({ categories: narrowest });
					for (const issue of others) {
						await issuesPage.table.expectRowGone(
							issuesPage.rowById(issue.issueId)
						);
					}
					for (const issue of byCategory.get(narrowest) ?? []) {
						await issuesPage.table.expectRowListed(
							issuesPage.rowById(issue.issueId)
						);
					}
				}
			);
		}
	);

	test(
		'Closed seeded issues are listed as Closed',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let closed!: SeededIssue[];

			await given('the seed closed some of its issues', () => {
				closed = seededClassification(requireManifest()).issues.filter(
					(issue) => issue.state === 'closed'
				);
				requireCapability(closed.length, 'the seed closed no issue');
			});
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				'each closed issue is listed with the Closed state',
				async () => {
					for (const issue of closed) {
						await issuesPage.expectClosedRow(issue.issueId);
					}
				}
			);
		}
	);

	test(
		'A closed seeded issue has its key struck through',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let closed!: SeededIssue;

			await given('the seed closed an issue that has a bug key', () => {
				closed = requireCapability(
					seededClassification(requireManifest()).issues.find(
						(issue) => issue.state === 'closed' && issue.key
					),
					'the seed closed no issue with a bug key'
				);
			});
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then("the issue's key is struck through", () =>
				issuesPage.expectKeyStruckThrough(closed.issueId)
			);
		}
	);

	test(
		'A resolvable bug key links out and a missing one falls back to the id',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let linked!: ShownKey;
			let unlinked!: ShownKey;
			let keyless!: ShownKey;

			await given(
				'the seed recorded a key its project tracks, a key it does not, and no key',
				() => {
					const keys = shownKeys();
					linked = requireCapability(
						keys.find((key) => key.href),
						'no seeded issue has a key whose tracker its project configures'
					);
					unlinked = requireCapability(
						keys.find((key) => key.issue.key && !key.href),
						'no seeded issue has a key whose tracker its project does not configure'
					);
					keyless = requireCapability(
						keys.find((key) => !key.issue.key),
						'no seeded issue is without a bug key'
					);
				}
			);
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				"the tracked key shows the key and links to the tracker's page for it",
				() =>
					issuesPage.expectKeyOf(linked.issue.issueId, linked.text, linked.href)
			);
			await and('the untracked key shows the key with no tracker link', () =>
				issuesPage.expectKeyOf(unlinked.issue.issueId, unlinked.text, null)
			);
			await and(
				'the issue without a key shows its id with no tracker link',
				() => issuesPage.expectKeyOf(keyless.issue.issueId, keyless.text, null)
			);
		}
	);

	test(
		'The long and the escaped seeded descriptions open in full and render literally',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let long!: SeededIssue;
			let escaped!: SeededIssue;

			await given(
				'the seed recorded a long description and one full of markup characters',
				() => {
					const described = seededClassification(
						requireManifest()
					).issues.filter((issue) => issue.description?.trim());
					long = requireCapability(
						described.reduce<SeededIssue | undefined>(
							(longest, issue) =>
								(issue.description?.length ?? 0) >
								(longest?.description?.length ?? 0)
									? issue
									: longest,
							undefined
						),
						'no seeded issue has a description'
					);
					escaped = requireCapability(
						described.find((issue) => /[<>&]/.test(issue.description ?? '')),
						'no seeded description holds <, > or &'
					);
				}
			);
			await when('I open the issues page', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
			});
			await then(
				"the long description's popover holds it from its first line to its last",
				() => {
					const lines = textLines(long.description ?? '');

					return issuesPage.expectDescriptionShows(long.issueId, long.title, [
						lines[0],
						lines[lines.length - 1]
					]);
				}
			);
			await and(
				"the other description's markup characters read as plain text",
				() =>
					issuesPage.expectDescriptionShows(
						escaped.issueId,
						escaped.title,
						textLines(escaped.description ?? '').filter((line) =>
							/[<>&]/.test(line)
						)
					)
			);
		}
	);

	test(
		'Paging through seeded issues ten at a time moves the range and clamps past the end',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let seededPages = 0;

			await given(
				'the seed recorded at least two full pages of ten issues',
				() => {
					const { issues } = seededClassification(requireManifest());
					requireCapability(
						issues.length >= 20,
						`the seed recorded ${issues.length} issues; page 2 of ten is full only from twenty`
					);
					seededPages = Math.ceil(issues.length / 10);
				}
			);
			await when('I open the issues page ten rows at a time', async () => {
				await issuesPage.goto({ pageSize: '10' });
				await issuesPage.expectLoaded();
			});
			await then(
				'the first page lists ten issues, the range reads from 1 to 10 and there are enough pages for the seeded issues',
				async () => {
					await issuesPage.expectPage(1, { atLeastPages: seededPages });
					await issuesPage.expectRowCount(10);
					await issuesPage.expectRangeSpans(1, 10);
				}
			);
			await when('I go to the next page', () => issuesPage.goToNextPage());
			await then(
				'page 2 is written to the URL and the range reads from 11 to 20',
				async () => {
					await issuesPage.expectParams({ page: '2', pageSize: '10' });
					await issuesPage.expectPage(2, { atLeastPages: seededPages });
					await issuesPage.expectRowCount(10);
					await issuesPage.expectRangeSpans(11, 20);
				}
			);
			await when('I open a page far past the end', async () => {
				await issuesPage.goto({ pageSize: '10', page: '999' });
				await issuesPage.expectLoaded();
			});
			await then(
				'the page is clamped to the last one, in the URL and the footer',
				() => issuesPage.expectClampedToLastPage({ atLeastPages: seededPages })
			);
		}
	);

	test(
		'The range past the first page counts every issue, not the page',
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let seeded = 0;

			await given(
				'the seed recorded at least two full pages of ten issues',
				() => {
					seeded = seededClassification(requireManifest()).issues.length;
					requireCapability(
						seeded >= 20,
						`the seed recorded ${seeded} issues; page 2 of ten is full only from twenty`
					);
				}
			);
			await when('I open the second page of ten issues', async () => {
				await issuesPage.goto({ pageSize: '10', page: '2' });
				await issuesPage.expectLoaded();
			});
			await then(
				'the range reads 11 to 20 of a total that counts at least the seeded issues',
				() => issuesPage.expectRangeOfTotal(11, 20, { atLeast: seeded })
			);
		}
	);

	test(
		'A dragged column order is written to the URL and restored from it',
		{ tag: ['@issues', '@needs-classification', '@url-params'] },
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let orderedUrl = '';

			await given('the seed recorded issues to list', () => {
				requireCapability(
					seededClassification(requireManifest()).issues.length,
					'the seed recorded no issue'
				);
			});
			await and('I open the issues page with Key left of Issue', async () => {
				await issuesPage.goto({ pageSize: '100' });
				await issuesPage.expectLoaded();
				await issuesPage.table.expectColumnLeftOf('Key', 'Issue');
			});
			await when(
				'I drag the Issue column above the Key column in the Columns menu',
				() => issuesPage.table.dragColumn('issue', 'key')
			);
			await then(
				'Issue is left of Key and the URL lists it first',
				async () => {
					await issuesPage.table.expectColumnLeftOf('Issue', 'Key');
					await issuesPage.expectOrderParamPuts('issue', 'key');
					orderedUrl = page.url();
				}
			);
			await when(
				'I open that URL again with the stored column order forgotten',
				async () => {
					await issuesPage.forgetStoredColumnOrder();
					await page.goto(orderedUrl);
					await issuesPage.expectLoaded();
				}
			);
			await then('Issue is still left of Key', () =>
				issuesPage.table.expectColumnLeftOf('Issue', 'Key')
			);
		}
	);

	test(
		"A project group's New Issue button opens with that project locked",
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			let project!: SeededProject;
			let trackers!: string[];
			let drawer!: IssueDrawer;

			await given(
				'the seed configured two trackers in a project it recorded issues in',
				() => {
					const manifest = requireManifest();
					const configured = requireCapability(
						manifest.projects,
						'the manifest records no project tracker configuration'
					).find((candidate) => candidate.trackers.length > 1);
					requireCapability(
						configured,
						'no seeded project configures two trackers'
					);
					trackers = configured?.trackers.map((tracker) => tracker.id) ?? [];
					project = requireCapability(
						seededClassification(manifest)
							.projects()
							.find((candidate) => candidate.name === configured?.name),
						`the seed recorded no issue in ${configured?.name}`
					);
				}
			);
			await when(
				"I click New Issue in that project's group heading",
				async () => {
					await issuesPage.goto({ pageSize: '100' });
					await issuesPage.expectLoaded();
					drawer = await issuesPage.openNewIssueInGroup(project.projectId);
				}
			);
			await then('the New Issue drawer asks for no project', () =>
				drawer.expectProjectFieldShown(false)
			);
			await and(
				"its Tracker starts on the project's first tracker and lists the project's trackers in order",
				async () => {
					await drawer.expectTracker(trackers[0]);
					await drawer.expectTrackerOptionsLeadWith(trackers);
				}
			);
			await and('I cancel without recording anything', () => drawer.cancel());
		}
	);
});
