/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { HistoryPageV2 } from '../../../pages/history-page';

// An alias of `/history`; both share one search schema (#61).
export const Route = createFileRoute('/_app/history/v2')({
	component: HistoryPageV2
});
