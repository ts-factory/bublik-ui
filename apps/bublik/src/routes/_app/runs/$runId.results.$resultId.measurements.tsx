/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { MeasurementsPage } from '../../../pages/measurements-page';

export const Route = createFileRoute(
	'/_app/runs/$runId/results/$resultId/measurements'
)({
	component: MeasurementsPage
});
