/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, type InferSearch } from '@/router';
import { ISSUE_RESULTS_PAGE_SEARCH } from '@/bublik/features/issue-results';

import { RUN_SHAPE } from './run.search';

const { shape, defaults } = ISSUE_RESULTS_PAGE_SEARCH;

/**
 * `/issues/$issueId/results`: the run page's result table over every result
 * stamped under one issue, paged by the server as the rules table is (the
 * table reads and writes its page through the same codecs), its filters kept
 * under the run page's keys.
 */
const issueResultsSearch = defineSearch(
	{
		page: shape.page,
		pageSize: shape.pageSize,
		columnFilters: RUN_SHAPE.columnFilters,
		globalRequirements: RUN_SHAPE.globalRequirements
	},
	{ page: defaults.page, pageSize: defaults.pageSize }
);

type IssueResultsSearch = InferSearch<typeof issueResultsSearch>;

export { issueResultsSearch };
export type { IssueResultsSearch };
