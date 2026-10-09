/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';

/**
 * The `/runs` route. Its schema lives with the route file
 * (`apps/bublik/src/routes/-search/runs.search.ts`); every key is a raw
 * string except `runData`, a `;`-joined list.
 */
const runsRoute = getRouteApi('/_app/_runs/runs');

/** The `/runs` search keys the list reads, as the route's codecs decode them. */
interface RunsSearchValues {
	mode?: string;
	page?: string;
	pageSize?: string;
	calendarMode?: string;
	startDate?: string;
	finishDate?: string;
	duration?: string;
	tagExpr?: string;
	runData?: string[];
}

export { runsRoute };
export type { RunsSearchValues };
