/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { MATCHER_HINTS } from './matcher-fields.utils';

/**
 * What the match scope says of itself, in one place so the section's hint,
 * the cards and the "How matching works" explainer cannot drift apart. The
 * field hints are `MATCHER_HINTS`, shared with the rule form.
 */
export const MATCH_SCOPE_COPY = {
	sectionHint: 'Future failures matching a rule below inherit this.',
	specificHint:
		'Future failures matching a rule below inherit this. Remove a value to widen the rules.',
	writtenLabel: 'Rules written',
	testHint: (count: number) =>
		`${count} result${count > 1 ? 's' : ''} of this test ${
			count > 1 ? 'are' : 'is'
		} being classified. Each rule keeps what its own results carry, so the rules always match ${
			count > 1 ? 'them' : 'it'
		}.`,
	verdictsHint: `${MATCHER_HINTS.verdicts} A rule keeps one list: its results’ own.`,
	explainer: [
		{
			term: 'Path',
			text: 'Always matched. A rule is written for one test. A card here is one test: its results that differ in parameters or run tags get rules of their own, all listed on the card.'
		},
		{
			term: 'Parameters',
			text: `${MATCHER_HINTS.parameters} A parameter is kept or removed by name, for every rule of the test; each rule keeps its own value.`
		},
		{
			term: 'Verdicts',
			text: `${MATCHER_HINTS.verdicts} A card keeps every list its results failed with, each in the rules of the results that failed with it, or drops them all. A result without verdicts gives a “No verdicts” list, whose rule matches only failures without any.`
		},
		{
			term: 'Tags',
			text: `${MATCHER_HINTS.tags} Important tags are kept to start with; relevant ones may be added. The tags are picked once for the form, and a rule keeps those of them its own runs have.`
		},
		{
			term: 'Emptied field',
			text: 'Not matched on at all. Empty everything and the rule matches every failure of the test.'
		}
	]
} as const;
