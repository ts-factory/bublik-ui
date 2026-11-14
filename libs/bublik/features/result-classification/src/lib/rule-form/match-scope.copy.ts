/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { MATCHER_HINTS } from './matcher-fields.utils';

/**
 * What the match scope says of itself, in one place so the section's hint,
 * the cards and the "How matching works" explainer cannot drift apart. The
 * field hints are `MATCHER_HINTS`, shared with the rule form.
 */
export const MATCH_SCOPE_COPY = {
	sectionHint: 'Future failures matching the rule below inherit this.',
	specificHint:
		'Future failures matching a rule below inherit this. Each rule is narrowed on its own.',
	oneoffHint: (rules: boolean, results: boolean) =>
		`${rules ? 'The rules' : 'The rule'} will be saved switched off: only ${
			results ? 'these results' : 'this result'
		} will be classified, and future runs will be left alone.`,
	testHint: (results: number, runs: number) =>
		`${results} result${results > 1 ? 's' : ''} of this test${
			runs > 1 ? ` in ${runs} runs` : ''
		}. Each rule below may keep what its results carry.`,
	verdictsHint: `${MATCHER_HINTS.verdicts} Results that failed with different lists get a rule per list.`,
	explainer: [
		{
			term: 'Path',
			text: 'Always matched. A rule is written for one test; a test whose results come from runs with different important tags gets a rule for each such group of runs.'
		},
		{
			term: 'Parameters',
			text: `${MATCHER_HINTS.parameters} A rule may keep the parameters all its results have.`
		},
		{
			term: 'Verdicts',
			text: `${MATCHER_HINTS.verdicts} A rule keeps every list its results failed with, stored as a rule per list, or drops them all. A result without verdicts gives a “No verdicts” list, which matches only failures without any.`
		},
		{
			term: 'Tags',
			text: `${MATCHER_HINTS.tags} Important tags are kept to start with; relevant ones may be added.`
		},
		{
			term: 'Emptied field',
			text: 'Not matched on at all. Empty everything and the rule matches every failure of the test. Rules left matching on the same values are stored as one.'
		}
	]
} as const;
