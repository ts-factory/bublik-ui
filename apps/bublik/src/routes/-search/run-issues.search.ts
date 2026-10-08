/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';

import { defineClassificationSearch } from './classification.search';
import { RUN_SHAPE } from './run.search';

/**
 * `/runs/$runId/issues`: the issues of one run. An open issue shows its
 * results in the run page's result table, which keeps its filters under the
 * run page's keys.
 */
const runIssuesSearch = defineClassificationSearch({
	facets: ['state', 'effect', 'categories'],
	pageSize: 25,
	sort: [{ id: 'result_count', desc: true }],
	extra: {
		columnFilters: RUN_SHAPE.columnFilters,
		globalRequirements: RUN_SHAPE.globalRequirements
	}
});

type RunIssuesSearch = InferSearch<typeof runIssuesSearch>;

export { runIssuesSearch };
export type { RunIssuesSearch };
