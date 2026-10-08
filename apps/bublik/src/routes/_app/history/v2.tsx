/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { HistoryPageV2 } from '../../../pages/history-page';
import { historySearch } from '../../-search/history.search';

// An alias of `/history`; both share one search schema (#61).
export const Route = createFileRoute('/_app/history/v2')({
	validateSearch: historySearch.validateSearch,
	search: { middlewares: historySearch.middlewares },
	component: HistoryPageV2
});
