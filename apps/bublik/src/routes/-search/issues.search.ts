/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';
import { ISSUES_TABLE_SEARCH } from '@/bublik/features/result-classification';

/**
 * `/issues`: every issue of the project. The issues table
 * reads and writes the same schema, so its defaults live with the table.
 */
const issuesSearch = ISSUES_TABLE_SEARCH;

type IssuesSearch = InferSearch<typeof issuesSearch>;

export { issuesSearch };
export type { IssuesSearch };
