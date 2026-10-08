/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';

import {
	defineClassificationSearch,
	RULE_FACETS
} from './classification.search';

/** `/issues/$issueId`: one issue's rules table. */
const issueSearch = defineClassificationSearch({
	facets: RULE_FACETS,
	pageSize: 100,
	sort: []
});

type IssueSearch = InferSearch<typeof issueSearch>;

export { issueSearch };
export type { IssueSearch };
