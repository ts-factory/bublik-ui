/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { PaginationState } from '@tanstack/react-table';

import { bool01, defineSearch, json, str, type InferSearch } from '@/router';
import type { ImportTaskFilters } from '@/shared/types';

/**
 * `/admin/import`. The filter form, the pagination and the
 * expanded rows are plain JSON; a reset writes `filters={}`. `taskId` opens
 * the log of one import and `poll` keeps it refreshing.
 */
const importSearch = defineSearch(
	{
		filters: json<ImportTaskFilters>(),
		pagination: json<PaginationState>(),
		expanded: json<Record<string, boolean>>(),
		taskId: str(),
		poll: bool01()
	},
	{ filters: {}, pagination: { pageIndex: 0, pageSize: 25 }, poll: false }
);

type ImportSearch = InferSearch<typeof importSearch>;

export { importSearch };
export type { ImportSearch };
