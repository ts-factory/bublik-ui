/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	bool01,
	date,
	defineSearch,
	enumOf,
	keepRaw,
	str,
	type InferSearch
} from '@/router';

/**
 * `/dashboard`. `main`, `secondary` and `mode` default to what
 * the API reports (the latest day, that day minus one, the deployment's
 * default mode), so the page fills those itself. `dates` is the legacy
 * base64 blob that the page rewrites to `mode`+`main`+`secondary` on mount;
 * it is only ever read. The two days keep an unparsable value as its raw
 * string (`keepRaw`): the page falls back to the latest day and
 * the link keeps what it was opened with, as `dashboard.feature` pins.
 */
const dashboardSearch = defineSearch(
	{
		main: keepRaw(date()),
		secondary: keepRaw(date()),
		mode: enumOf(['rows', 'rows-line', 'columns']),
		search: str(),
		reload: bool01(),
		tv: bool01(),
		dates: str()
	},
	{ reload: false, tv: false }
);

type DashboardSearch = InferSearch<typeof dashboardSearch>;

export { dashboardSearch };
export type { DashboardSearch };
