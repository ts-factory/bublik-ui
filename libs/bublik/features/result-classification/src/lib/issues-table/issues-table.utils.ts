/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Issue } from '@/shared/types';

import { CATEGORY_ORDER } from '../classification/classification.constants';
import { makeSearchFilter } from '../classification-table/classification-table.utils';
import type { IssueTableRow } from './issues-table.types';

/**
 * `/issues/` carries the active rules, the rule counts and the resolved tracker
 * URL itself, so a row is the issue plus the few things only the table cares
 * about: the display order of the badges, the derived rules state, and the
 * project's name.
 *
 * `projectName` is what the project's grouped-row heading shows; the id itself
 * is what the table groups by.
 */
export function buildRows(
	issues: Issue[],
	projectNames: Map<number, string>
): IssueTableRow[] {
	return issues.map((issue) => {
		const rules = [...issue.rules].sort(
			(a, b) =>
				CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
		);

		return {
			...issue,
			rules,
			ruleCount: issue.rule_count,
			activeRuleCount: issue.active_rule_count,
			rulesState: issue.rules_state,
			bugKey: issue.bug_key,
			bugUrl: issue.bug_url,
			projectName:
				projectNames.get(issue.project) ?? `Project #${issue.project}`
		};
	});
}

export const searchFilter = makeSearchFilter<IssueTableRow>((issue) => [
	issue.title,
	issue.description,
	issue.bugKey,
	`#${issue.id}`
]);
