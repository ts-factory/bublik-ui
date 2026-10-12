/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';
import type { IssueRule } from '@/shared/types';

import { formatBugKey } from '../classification/classification.utils';
import type { IssueRuleRow } from './issue-rules-table.types';

/**
 * A rule carries everything a row shows about its issue — title, state, bug
 * key, project name — read through the issue by `IssueRuleSerializer`, so a
 * page of rules needs no second request to describe itself.
 */
export function buildRows(rules: IssueRule[]): IssueRuleRow[] {
	return rules.map((rule) => ({
		...rule,
		issueTitle: rule.issue_title || `#${rule.issue}`,
		issueState: rule.issue_state,
		bugKey: formatBugKey(rule.bug_key),
		bugUrl: rule.bug_url,
		projectName: rule.project_name || `Project #${rule.project}`
	}));
}

/**
 * A captured tag or `name=value` parameter as a reader sees it: `name: value`.
 * Only ever a label — what a filter holds and sends is the value as captured.
 */
export function formatMatcherValue(value: string): string {
	return formatKeyValueForDisplay(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
}

/** The rule's tags as captured, the spelling the `tag` filter takes. */
export function ruleTagValues(rule: Pick<IssueRule, 'tags'>): string[] {
	return rule.tags ?? [];
}

/**
 * The rule's parameters as `name=value`, the spelling the `parameter` filter
 * takes and the facets count them by.
 */
export function ruleParameterValues(
	rule: Pick<IssueRule, 'parameters'>
): string[] {
	return Object.entries(rule.parameters ?? {}).map(
		([key, value]) => `${key}=${value}`
	);
}

export function ruleTags(rule: Pick<IssueRule, 'tags'>): string[] {
	return ruleTagValues(rule).map(formatMatcherValue);
}

export function ruleParameters(rule: Pick<IssueRule, 'parameters'>): string[] {
	return ruleParameterValues(rule).map(formatMatcherValue);
}
