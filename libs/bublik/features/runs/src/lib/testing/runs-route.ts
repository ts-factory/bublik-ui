/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * For specs only: the `/runs` and `/compare` routes as the app's route files
 * wire them (`apps/bublik/src/routes/-search/runs.search.ts`,
 * `compare.search.ts`), which a lib cannot import. The app's
 * `search-schemas.spec.ts` pins those against the wire strings.
 */
import type { TestRoute } from '@/router/testing';
import { defineSearch, delimited, enumOf, str } from '@/router';

const RUNS_ROUTE: TestRoute = {
	id: '/_app/_runs/runs',
	search: defineSearch({
		mode: enumOf(['table', 'charts', 'progress']),
		page: str(),
		pageSize: str(),
		calendarMode: enumOf(['default', 'duration']),
		startDate: str(),
		finishDate: str(),
		duration: str(),
		tagExpr: str(),
		runData: delimited(';')
	})
};

export { RUNS_ROUTE };
