/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Issue, IssueRule } from '@/shared/types';

import {
	CATEGORY_ORDER,
	issueRulesState
} from '../classification/classification.utils';
import { makeSearchFilter } from '../classification-table/classification-table.utils';
import type { IssueTableRow } from './issues-table.types';

export function buildRows(
	issues: Issue[],
	rules: IssueRule[],
	projectNames: Map<number, string>
): IssueTableRow[] {
	const byIssue = new Map<number, IssueRule[]>();

	for (const rule of rules) {
		const existing = byIssue.get(rule.issue);
		if (existing) existing.push(rule);
		else byIssue.set(rule.issue, [rule]);
	}

	return issues.map((issue) => {
		const issueRules = byIssue.get(issue.id) ?? [];

		const categories =
			issue.categories ??
			Array.from(new Set(issueRules.map((rule) => rule.category))).sort(
				(a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
			);
		const ruleCount = issue.rule_count ?? issueRules.length;
		const issueProjects = Array.from(
			new Set(
				issueRules.map(
					(rule) => projectNames.get(rule.project) ?? `Project #${rule.project}`
				)
			)
		).sort((a, b) => a.localeCompare(b));
		const activeRuleCount =
			issue.active_rule_count ??
			issueRules.filter((rule) => rule.active).length;

		return {
			...issue,
			categories,
			ruleCount,
			activeRuleCount,
			rulesState: issueRulesState({
				state: issue.state,
				total: ruleCount,
				active: activeRuleCount
			}).value,
			bugKey: issue.issue_ext?.key ?? null,
			// TODO(api): `/issues/` returns no resolved tracker URL, so this is
			// null today and the chip renders without its link. The run-scoped
			// endpoint already resolves it (`run_issues_summary` -> `resolve_ref`);
			// the list endpoint needs the same treatment.
			bugUrl: issue.bug_url ?? null,
			projectNames: issueProjects
		};
	});
}

export const searchFilter = makeSearchFilter<IssueTableRow>((issue) => [
	issue.title,
	issue.description,
	issue.bugKey,
	`#${issue.id}`
]);
