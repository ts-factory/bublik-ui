/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';
import type { Issue, IssueRule } from '@/shared/types';

import { formatBugKey } from '../classification/classification.utils';
import type { IssueRuleRow } from './issue-rules-table.types';

export function buildRows(
	rules: IssueRule[],
	issues: Issue[],
	projectNames: Map<number, string>
): IssueRuleRow[] {
	const byId = new Map(issues.map((issue) => [issue.id, issue]));

	return rules.map((rule) => {
		const issue = byId.get(rule.issue);

		return {
			...rule,
			issueTitle: issue?.title ?? `#${rule.issue}`,
			issueState: issue?.state ?? null,
			bugKey: formatBugKey(issue?.issue_ext?.key ?? null),
			bugUrl: issue?.bug_url ?? null,
			projectName: projectNames.get(rule.project) ?? `Project #${rule.project}`
		};
	});
}

/**
 * Tags are `key=value` too, so they take the same display delimiter as
 * parameters — the run details panel formats them the same way.
 */
export function ruleTags(rule: Pick<IssueRule, 'tags'>): string[] {
	return (rule.tags ?? []).map((tag) =>
		formatKeyValueForDisplay(tag, {
			displayDelimiter: config.keyValueDisplayDelimiter,
			submitDelimiter: config.keyValueSubmitDelimiter
		})
	);
}

/** Matcher parameters in display form, which is also what the facet offers. */
export function ruleParameters(rule: Pick<IssueRule, 'parameters'>): string[] {
	return Object.entries(rule.parameters ?? {}).map(([key, value]) =>
		formatRuleParameter(key, value)
	);
}

/** The display form of a matcher parameter. */
export function formatRuleParameter(key: string, value: string) {
	return formatKeyValueForDisplay(
		`${key}${config.keyValueSubmitDelimiter}${value}`,
		{
			displayDelimiter: config.keyValueDisplayDelimiter,
			submitDelimiter: config.keyValueSubmitDelimiter
		}
	);
}
