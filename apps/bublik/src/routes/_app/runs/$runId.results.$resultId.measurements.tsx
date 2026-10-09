/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, redirect } from '@tanstack/react-router';

import { convertOldUrlSearch, isOldUrl } from '@/router';

import { MeasurementsPage } from '../../../pages/measurements-page';
import { measurementsSearch } from '../../-search/measurements.search';

export const Route = createFileRoute(
	'/_app/runs/$runId/results/$resultId/measurements'
)({
	validateSearch: measurementsSearch.validateSearch,
	search: { middlewares: measurementsSearch.middlewares },
	// A legacy jsurl (`~`) link lands on its legacy-codec rewrite, replacing
	// the entry and dropping the hash, as `useSearchState`'s mount effect did
	// with `window.location.replace`. An `href` rather than a
	// search object, so the rewrite keeps the legacy codec's bytes.
	beforeLoad: ({ location }) => {
		if (!isOldUrl(location.searchStr)) return;

		throw redirect({
			href: `${location.pathname}${convertOldUrlSearch(location.searchStr)}`,
			replace: true
		});
	},
	component: MeasurementsPage
});
