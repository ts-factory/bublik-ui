/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import type { IssueRuleFacets, IssueState } from '@/shared/types';

import {
	CATEGORY_ORDER,
	DISPOSITION_META,
	DISPOSITION_ORDER
} from '../classification/classification.constants';
import {
	categoryMeta,
	dispositionKey,
	issueStateMeta,
	ruleActiveMeta
} from '../classification/classification.utils';
import {
	countBy,
	countedFacetOptions,
	countedOpenFacetOptions
} from '../classification-table/classification-table.utils';
import { ACTIVE_ORDER, type ActiveKey } from './issue-rules-table.constants';
import type { IssueRuleRow } from './issue-rules-table.types';
import {
	formatMatcherValue,
	ruleParameterValues,
	ruleTagValues
} from './issue-rules-table.utils';

const ISSUE_STATE_ORDER = [
	'open',
	'closed'
] as const satisfies readonly IssueState[];

/**
 * Every facet counts from `/issue_rules/facets/` — the whole filtered set, each
 * dimension with its own filter lifted — with the page's rows standing in
 * until it answers, or for a server too old to count a dimension.
 *
 * Tag and parameter options carry the value as captured (`name=value`), the
 * spelling the filters send; only the label reads `name: value`.
 */
export function useFacetOptions(
	rules: IssueRuleRow[],
	facets?: IssueRuleFacets
) {
	return useMemo(
		() => ({
			categoryOptions: countedFacetOptions({
				counts: facets?.category ?? countBy(rules.map((rule) => rule.category)),
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).label,
				keywordsFor: (category) => [categoryMeta(category).displayValue]
			}),
			dispositionOptions: countedFacetOptions({
				counts:
					facets?.expected ??
					countBy(rules.map((rule) => dispositionKey(rule.expected))),
				order: DISPOSITION_ORDER,
				labelFor: (disposition) => DISPOSITION_META[disposition].label
			}),
			activeOptions: countedFacetOptions({
				counts:
					facets?.active ??
					countBy(rules.map((rule) => String(rule.active) as ActiveKey)),
				order: ACTIVE_ORDER,
				labelFor: (value) => ruleActiveMeta(value === 'true').label
			}),
			issueStateOptions: countedFacetOptions({
				counts:
					facets?.issue_state ?? countBy(rules.map((rule) => rule.issueState)),
				order: ISSUE_STATE_ORDER,
				labelFor: (state) => issueStateMeta(state).label
			}),
			parameterOptions: countedOpenFacetOptions(
				facets?.parameter ?? countBy(rules.flatMap(ruleParameterValues)),
				formatMatcherValue
			),
			verdictOptions: countedOpenFacetOptions(
				facets?.verdict ?? countBy(rules.flatMap((rule) => rule.verdicts ?? []))
			),
			tagOptions: countedOpenFacetOptions(
				facets?.tag ?? countBy(rules.flatMap(ruleTagValues)),
				formatMatcherValue
			)
		}),
		[rules, facets]
	);
}
