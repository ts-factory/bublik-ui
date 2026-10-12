/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';
import { RUN_ISSUES_TABLE_SEARCH } from '@/bublik/features/result-classification';

/**
 * `/runs/$runId/issues`: the issues of one run. The run issues
 * table reads and writes the same schema.
 */
const runIssuesSearch = RUN_ISSUES_TABLE_SEARCH;

type RunIssuesSearch = InferSearch<typeof runIssuesSearch>;

export { runIssuesSearch };
export type { RunIssuesSearch };
