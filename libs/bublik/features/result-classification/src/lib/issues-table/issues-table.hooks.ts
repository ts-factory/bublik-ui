/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import type { IssueFacets } from '@/shared/types';

import {
	CATEGORY_ORDER,
	ISSUE_RULES_STATE_META,
	RULES_STATE_ORDER
} from '../classification/classification.constants';
import {
	categoryMeta,
	issueStateMeta
} from '../classification/classification.utils';
import {
	buildFacetOptions,
	countBy,
	countedFacetOptions
} from '../classification-table/classification-table.utils';
import type { IssueTableRow } from './issues-table.types';

/**
 * Counts from `/issues/facets/` — the whole filtered set, not the page. Until
 * the facets arrive the page's own rows stand in, so the filters are never
 * empty while they load.
 */
export function useFacetOptions(rows: IssueTableRow[], facets?: IssueFacets) {
	return useMemo(() => {
		const stateCounts = facets?.state ?? countBy(rows.map((row) => row.state));
		const rulesCounts =
			facets?.rules ?? countBy(rows.map((row) => row.rulesState));

		return {
			stateOptions: countedFacetOptions({
				counts: stateCounts,
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			rulesOptions: countedFacetOptions({
				counts: rulesCounts,
				order: RULES_STATE_ORDER,
				labelFor: (value) => ISSUE_RULES_STATE_META[value].label
			}),
			categoryOptions: facets
				? countedFacetOptions({
						counts: facets.categories,
						order: CATEGORY_ORDER,
						labelFor: (category) => categoryMeta(category).label,
						keywordsFor: (category) => [categoryMeta(category).displayValue]
				  })
				: buildFacetOptions({
						// Once per issue, as the server counts distinct issues.
						values: rows.flatMap((row) =>
							Array.from(new Set(row.rules.map((rule) => rule.category)))
						),
						order: CATEGORY_ORDER,
						labelFor: (category) => categoryMeta(category).label,
						keywordsFor: (category) => [categoryMeta(category).displayValue]
				  })
		};
	}, [rows, facets]);
}
