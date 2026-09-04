/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import type { IssueState } from '@/shared/types';

import {
	CATEGORY_ORDER,
	DISPOSITION_META,
	DISPOSITION_ORDER,
	categoryMeta,
	dispositionKey,
	issueStateMeta,
	ruleActiveMeta
} from '../classification/classification.utils';
import {
	buildFacetOptions,
	openFacetOptions
} from '../classification-table/classification-table.utils';
import {
	ACTIVE_ORDER,
	type ActiveKey
} from './issue-rules-table.constants';
import type { IssueRuleRow } from './issue-rules-table.types';
import { ruleParameters, ruleTags } from './issue-rules-table.utils';

export function useFacetOptions(rules: IssueRuleRow[]) {
	return useMemo(
		() => ({
			categoryOptions: buildFacetOptions({
				values: rules.map((rule) => rule.category),
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			}),
			dispositionOptions: buildFacetOptions({
				values: rules.map((rule) => dispositionKey(rule.expected)),
				order: DISPOSITION_ORDER,
				labelFor: (disposition) => DISPOSITION_META[disposition].label
			}),
			activeOptions: buildFacetOptions({
				values: rules.map((rule) => String(rule.active) as ActiveKey),
				order: ACTIVE_ORDER,
				labelFor: (value) => ruleActiveMeta(value === 'true').label
			}),
			// Open-ended axes: the values come from the data, so the display order
			// is alphabetical rather than a fixed meaning-carrying sequence.
			parameterOptions: openFacetOptions(rules.flatMap(ruleParameters)),
			verdictOptions: openFacetOptions(
				rules.flatMap((rule) => rule.verdicts ?? [])
			),
			tagOptions: openFacetOptions(rules.flatMap(ruleTags)),
			issueStateOptions: buildFacetOptions({
				values: rules
					.map((rule) => rule.issueState)
					.filter((state): state is IssueState => state !== null),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			projectOptions: openFacetOptions(rules.map((rule) => rule.projectName))
		}),
		[rules]
	);
}
