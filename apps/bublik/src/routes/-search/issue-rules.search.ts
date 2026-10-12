/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';
import { ISSUE_RULES_TABLE_SEARCH } from '@/bublik/features/result-classification';

/**
 * `/issues/rules`: every rule, with its issue's state as one
 * more facet. The rules table reads and writes the same schema.
 */
const issueRulesSearch = ISSUE_RULES_TABLE_SEARCH;

type IssueRulesSearch = InferSearch<typeof issueRulesSearch>;

export { issueRulesSearch };
export type { IssueRulesSearch };
