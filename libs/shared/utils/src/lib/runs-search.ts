/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	defineSearch,
	delimited,
	enumOf,
	str,
	type InferSearch
} from '@/router';
import { config } from '@/bublik/config';

/**
 * `/runs`. The dates are raw `yyyy-MM-dd` strings, not dates:
 * the form writes or deletes both together and the backend window applies
 * when they are absent. `duration` is an ISO 8601 duration in duration
 * calendar mode. `runData` is written sorted and deduplicated by the form.
 */
const runsSearch = defineSearch(
	{
		mode: enumOf(['table', 'charts', 'progress']),
		page: str(),
		pageSize: str(),
		calendarMode: enumOf(['default', 'duration']),
		startDate: str(),
		finishDate: str(),
		duration: str(),
		tagExpr: str(),
		runData: delimited(config.queryDelimiter)
	},
	{ mode: 'table', page: '1', pageSize: '25', calendarMode: 'default' }
);

type RunsSearch = InferSearch<typeof runsSearch>;

export { runsSearch };
export type { RunsSearch };
