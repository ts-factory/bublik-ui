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
import { formatTimeToAPI, parseTimeApi } from './time';

/**
 * `/dashboard`, the route's search schema: the route file wires
 * it, the dashboard hooks read and write its keys typed. `main`, `secondary`
 * and `mode` default to what the API reports (the latest day, that day minus
 * one, the deployment's default mode), so the page fills those itself.
 * `dates` is the legacy base64 blob that the route rewrites to
 * `mode`+`main`+`secondary` before the page loads; it is only ever read. The
 * two days keep an unparsable value as its raw string (`keepRaw`): the page falls back to the latest day and the link keeps what it was
 * opened with, as `dashboard.feature` pins.
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

/** The dashboard's typed search; the root keys (`project`, `_s`, …) pass through. */
type DashboardSearch = InferSearch<typeof dashboardSearch>;

/** The keys the legacy rewrite carries over from the link. */
interface LegacyDatesCarried {
	project?: number[];
	_s?: string;
}

/**
 * The search a legacy `?dates=<base64 JSON of days>` link is rewritten to,
 * or `undefined` when there is no blob or it cannot be read (the page then
 * opens as it is). The two days are sorted: the earlier is `secondary`, the
 * later `main`; a single day is `main`. `mode` comes first as before, and
 * the selected projects and the sidebar state follow (they used to be
 * dropped); every other key is dropped, as it was.
 */
function rewriteLegacyDates(
	search: DashboardSearch & LegacyDatesCarried
): DashboardSearch | undefined {
	if (!search.dates) return undefined;

	try {
		const encoded = JSON.parse(window.atob(search.dates)) as Record<
			string,
			string
		>;
		const [earlier, later] = Object.values(encoded)
			.map((day) => parseTimeApi(day).getTime())
			.sort((a, b) => a - b)
			.map((time) => new Date(time));

		const rewritten: DashboardSearch = {};

		if (search.mode) rewritten.mode = search.mode;

		if (earlier && later) {
			rewritten.secondary = formatTimeToAPI(earlier);
			rewritten.main = formatTimeToAPI(later);
		} else if (earlier) {
			rewritten.main = formatTimeToAPI(earlier);
		}

		if (search.project !== undefined) rewritten.project = search.project;
		if (search._s !== undefined) rewritten._s = search._s;

		return rewritten;
	} catch (error: unknown) {
		console.warn('Failed parsing search', error);

		return undefined;
	}
}

export { dashboardSearch, rewriteLegacyDates };
export type { DashboardSearch };
