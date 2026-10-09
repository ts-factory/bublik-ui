/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, type InferSearch } from '@/router';
import { RUN_ISSUES_TABLE_SEARCH } from '@/bublik/features/result-classification';

import { RUN_TABLE_SHAPE } from './run.search';

/**
 * `/runs/$runId/issues`: the issues of one run. The run issues
 * table reads and writes the same schema. An open issue shows its results
 * in the run page's result table, which keeps its filters under the run
 * page's keys.
 */
const RUN_ISSUES_SHAPE = {
	...RUN_ISSUES_TABLE_SEARCH.shape,
	columnFilters: RUN_TABLE_SHAPE.columnFilters,
	globalRequirements: RUN_TABLE_SHAPE.globalRequirements
};

const runIssuesSearch = defineSearch<typeof RUN_ISSUES_SHAPE>(
	RUN_ISSUES_SHAPE,
	RUN_ISSUES_TABLE_SEARCH.defaults
);

type RunIssuesSearch = InferSearch<typeof runIssuesSearch>;

export { runIssuesSearch };
export type { RunIssuesSearch };
