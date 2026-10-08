/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, type InferSearch } from '@/router';

import { PAGING_SHAPE } from './classification.search';
import { RUN_SHAPE } from './run.search';

/**
 * `/issues/$issueId/results`: the run page's result table over every result
 * stamped under one issue, paged by the server as the rules table is, its
 * filters kept under the run page's keys.
 */
const issueResultsSearch = defineSearch(
	{
		...PAGING_SHAPE,
		columnFilters: RUN_SHAPE.columnFilters,
		globalRequirements: RUN_SHAPE.globalRequirements
	},
	{ page: 1, pageSize: 25 }
);

type IssueResultsSearch = InferSearch<typeof issueResultsSearch>;

export { issueResultsSearch };
export type { IssueResultsSearch };
