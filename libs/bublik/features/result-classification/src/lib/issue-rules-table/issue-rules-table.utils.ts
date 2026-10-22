/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';
import type { IssueRule } from '@/shared/types';

import { formatBugKey } from '../classification/classification.utils';
import { NO_VERDICTS_TEXT } from '../rule-form/matcher-fields.utils';
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

/**
 * The rule's verdicts as the `verdicts` filter takes them and the facets count
 * them: the whole list as JSON, since the server matches it exactly and in
 * order, `null` for a rule ignoring the verdicts, `[]` for one of the
 * results without any. Spelled the one way, so a chip, an option and a URL
 * value agree, whatever spacing the server's JSON used.
 */
export function ruleVerdictsKey(
	verdicts: readonly string[] | null | undefined
): string {
	return JSON.stringify(verdicts ?? null);
}

/**
 * The verdict list behind a filter value: null when the value filters the
 * rules ignoring the verdicts. A value that is not a JSON list is a verdict
 * on its own, as the filter took them before the lists were matched whole,
 * and stands for the list of just it, so an old URL still narrows the rules.
 */
export function parseVerdictsKey(key: string): string[] | null {
	try {
		const parsed: unknown = JSON.parse(key);

		if (parsed === null) return null;
		if (
			Array.isArray(parsed) &&
			parsed.every((entry) => typeof entry === 'string')
		) {
			return parsed;
		}
	} catch {
		// Not JSON: a single verdict, handled below.
	}

	return [key];
}

/** A filter value in the spelling the server and the chips agree on. */
export function normalizeVerdictsKey(key: string): string {
	return ruleVerdictsKey(parseVerdictsKey(key));
}

/** What the Verdicts filter says a rule ignoring the verdicts does. */
export const VERDICTS_IGNORED_TEXT = 'Not matched on';

/**
 * The words of a verdict-list option, for the filter's search and the order
 * of its list: the verdicts themselves, or what the chips say for none.
 */
export function verdictsKeyLabel(key: string): string {
	const verdicts = parseVerdictsKey(key);

	if (verdicts === null) return VERDICTS_IGNORED_TEXT;

	return verdicts.length ? verdicts.join(', ') : NO_VERDICTS_TEXT;
}

export function ruleTags(rule: Pick<IssueRule, 'tags'>): string[] {
	return ruleTagValues(rule).map(formatMatcherValue);
}

export function ruleParameters(rule: Pick<IssueRule, 'parameters'>): string[] {
	return ruleParameterValues(rule).map(formatMatcherValue);
}
