/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { MeasurementsPage } from '../../../pages/measurements-page';
import { redirectOldUrl } from '../../-redirect-old-url';
import { measurementsSearch } from '../../-search/measurements.search';

export const Route = createFileRoute(
	'/_app/runs/$runId/results/$resultId/measurements'
)({
	validateSearch: measurementsSearch.validateSearch,
	search: { middlewares: measurementsSearch.middlewares },
	// A legacy jsurl (`~`) link lands on its legacy-codec rewrite, replacing
	// the entry and dropping the hash.
	beforeLoad: redirectOldUrl,
	component: MeasurementsPage
});
