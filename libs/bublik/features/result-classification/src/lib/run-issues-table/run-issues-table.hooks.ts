/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import type { IssueCategory, RunIssueRow } from '@/shared/types';

import {
	CATEGORY_ORDER,
	EFFECT_ORDER,
	RUN_ISSUE_EFFECT_META,
	categoryMeta,
	issueStateMeta,
	runIssueEffect
} from '../classification/classification.utils';
import { buildFacetOptions } from '../classification-table/classification-table.utils';

/** Options carry live counts so an empty facet is obvious before you open it. */
export function useFacetOptions(issues: RunIssueRow[]) {
	return useMemo(
		() => ({
			stateOptions: buildFacetOptions({
				values: issues.map((issue) => issue.state),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			effectOptions: buildFacetOptions({
				values: issues.map((issue) => runIssueEffect(issue).value),
				order: EFFECT_ORDER,
				// The long form: a dropdown has the room, and AGAIN on its own is a
				// word rather than an answer.
				labelFor: (effect) => RUN_ISSUE_EFFECT_META[effect].displayValue
			}),
			categoryOptions: buildFacetOptions({
				values: issues.flatMap((issue) =>
					Array.from(new Set(issue.categories.map((c) => c.category)))
				) as IssueCategory[],
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			})
		}),
		[issues]
	);
}

