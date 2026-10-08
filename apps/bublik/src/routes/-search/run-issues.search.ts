/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';

import { defineClassificationSearch } from './classification.search';

/** `/runs/$runId/issues`: the issues of one run. */
const runIssuesSearch = defineClassificationSearch({
	facets: ['state', 'effect', 'categories'],
	pageSize: 25,
	sort: []
});

type RunIssuesSearch = InferSearch<typeof runIssuesSearch>;

export { runIssuesSearch };
export type { RunIssuesSearch };
