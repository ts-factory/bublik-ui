/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { historySearch, type HistoryRouteSearch } from '@/shared/utils';

/**
 * `/history` and `/history/v2`. The schema is shared with the
 * history feature, which reads the page's search through it, so it is
 * defined in `@/shared/utils` (`lib/history-search.ts`).
 */
type HistorySearch = HistoryRouteSearch;

export { historySearch };
export type { HistorySearch };
