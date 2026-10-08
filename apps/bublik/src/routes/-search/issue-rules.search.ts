/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';

import {
	defineClassificationSearch,
	RULE_FACETS
} from './classification.search';

/** `/issues/rules`: every rule, with its issue's state as one more facet. */
const issueRulesSearch = defineClassificationSearch({
	facets: ['issueState', ...RULE_FACETS],
	pageSize: 100,
	sort: []
});

type IssueRulesSearch = InferSearch<typeof issueRulesSearch>;

export { issueRulesSearch };
export type { IssueRulesSearch };
