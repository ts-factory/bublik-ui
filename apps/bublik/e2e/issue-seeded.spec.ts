/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { test } from './support/test';

import { IssuePage } from './pages/issue-page';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import {
	seededClassification,
	type SeededIssue
} from './support/seeded-classification';

const SEEDED = { tag: ['@issues', '@needs-classification'] };

function activeRuleCount(issue: SeededIssue): number {
	return issue.rules.filter((rule) => rule.active).length;
}

/**
 * The description's last line as it renders: markdown emphasis, code and list
 * markers dropped. It sits below the clip of a long description.
 */
function lastLine(issue: SeededIssue): string {
	const lines = (issue.description ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	return (lines[lines.length - 1] ?? '')
		.replace(/^(#+|[-*]|\d+\.)\s+/, '')
		.replace(/[*_`]/g, '');
}

async function openIssue(issuePage: IssuePage, issue: SeededIssue) {
	await issuePage.goto(issue.issueId);
	await issuePage.expectLoaded(issue.title);
}

test.describe('Issue Page against seeded classification', () => {
	test(
		'A seeded issue with several rules counts how many of them are active',
		SEEDED,
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			let multiRule!: SeededIssue;
			let dormant!: SeededIssue;

			await given('the seed recorded an issue with several rules', () => {
				const seeded = seededClassification(requireManifest());
				const several = seeded.issues
					.filter((issue) => issue.rules.length > 1)
					.sort((a, b) => b.rules.length - a.rules.length);
				// A partly active issue is the case the count exists for; the
				// widest multi-rule issue stands in while the plan has none.
				multiRule = requireCapability(
					several.find((issue) => {
						const active = activeRuleCount(issue);
						return active > 0 && active < issue.rules.length;
					}) ?? several[0],
					'the seeded classification has no issue with several rules'
				);
				dormant = requireCapability(
					seeded.issues.find(
						(issue) =>
							issue.state === 'open' &&
							issue.rules.length === 1 &&
							!issue.rules[0].active
					),
					'the seeded classification has no open issue whose only rule is inactive'
				);
			});
			await when("I open that issue's page", () =>
				openIssue(issuePage, multiRule)
			);
			await then(
				'the rules fact counts its active rules out of all of them',
				() =>
					issuePage.expectRulesState(
						multiRule.rulesState,
						`${activeRuleCount(multiRule)} of ${
							multiRule.rules.length
						} rules active`
					)
			);
			await and(
				'each of its rules is listed as active or inactive as the seed left it',
				async () => {
					await issuePage.expectRulesReady();
					for (const rule of multiRule.rules) {
						await issuePage.expectRuleActive(
							issuePage.ruleRow(rule.ruleId),
							rule.active
						);
					}
				}
			);
			await when('I open a seeded open issue whose only rule is inactive', () =>
				openIssue(issuePage, dormant)
			);
			await then('the rules fact counts none of its rules as active', () =>
				issuePage.expectRulesState(dormant.rulesState, '0 of 1 rules active')
			);
		}
	);

	test(
		'A long seeded description is clipped behind a popover and a short one is shown inline',
		SEEDED,
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			let long!: SeededIssue;
			let short!: SeededIssue;

			await given(
				'the seed recorded issues with a very long and a short description',
				() => {
					const described = seededClassification(requireManifest())
						.issues.filter((issue) => issue.description?.trim())
						.sort(
							(a, b) =>
								(a.description?.length ?? 0) - (b.description?.length ?? 0)
						);
					requireCapability(
						described.length > 1,
						'the seeded classification has fewer than two described issues'
					);
					short = described[0];
					long = described[described.length - 1];
				}
			);
			await when('I open the page of the issue with the long description', () =>
				openIssue(issuePage, long)
			);
			await then('its description is clipped behind a button', () =>
				issuePage.expectDescriptionClipped()
			);
			await when('I open the description', () => issuePage.openDescription());
			await then('a popover shows the description to its last line', () =>
				issuePage.expectDescriptionPopover(lastLine(long))
			);
			await when(
				'I open the page of the issue with the short description',
				() => openIssue(issuePage, short)
			);
			await then(
				'its description is shown inline to its last line, with no button',
				() => issuePage.expectDescriptionInline(lastLine(short))
			);
		}
	);

	test(
		'A seeded closed issue lists the date it was closed',
		SEEDED,
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			let closed!: SeededIssue;

			await given('the seed recorded a closed issue', () => {
				closed = requireCapability(
					seededClassification(requireManifest()).issues.find(
						(issue) => issue.state === 'closed' && issue.rules.length > 0
					),
					'the seeded classification has no closed issue with rules'
				);
			});
			await when("I open that issue's page", () =>
				openIssue(issuePage, closed)
			);
			await then('the issue is shown as closed', () =>
				issuePage.expectState('closed')
			);
			await and('the facts list the date it was closed', () =>
				issuePage.expectClosedDate()
			);
			await and('the rules fact says its rules were deactivated', () =>
				issuePage.expectRulesState(
					closed.rulesState,
					`0 of ${closed.rules.length} rules active`
				)
			);
		}
	);
});
