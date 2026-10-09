/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';
import { ISSUE_TABLE_SEARCH } from '@/bublik/features/result-classification';

/**
 * `/issues/$issueId`: one issue's rules table, the rule facets
 * without the issue's state, with the rules table's defaults.
 */
const issueSearch = ISSUE_TABLE_SEARCH;

type IssueSearch = InferSearch<typeof issueSearch>;

export { issueSearch };
export type { IssueSearch };
