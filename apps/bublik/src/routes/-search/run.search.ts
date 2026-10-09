/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	RUN_TABLE_SHAPE,
	runSearch,
	type RunRouteSearch
} from '@/shared/utils';

/**
 * `/runs/$runId`. The run table's schema is shared with the run
 * feature, which reads and writes its keys on this route and on `/multiple`,
 * so it is defined in `@/shared/utils` (`lib/run-search.ts`).
 */
type RunSearch = RunRouteSearch;

export { RUN_TABLE_SHAPE, runSearch };
export type { RunSearch };
