/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';

import { MeasurementsMode } from '@/shared/types';

/**
 * The measurements page route. Everything under
 * `MeasurementContainer` renders inside its match and reads params and
 * search through it; the sidebar renders outside and reads non-strictly.
 */
const measurementsRoute = getRouteApi(
	'/_app/runs/$runId/results/$resultId/measurements'
);

const NO_CHARTS: number[] = [];

/** The layout mode on the URL, `default` when absent (an unknown one is kept as is). */
function useMeasurementsMode(): MeasurementsMode {
	return measurementsRoute.useSearch({
		select: (search) =>
			(search.mode ?? MeasurementsMode.Default) as MeasurementsMode
	});
}

/** The selected chart ids on the URL, `[]` when absent. */
function useSelectedChartIds(): number[] {
	return measurementsRoute.useSearch({
		select: (search) => search.selectedCharts ?? NO_CHARTS
	});
}

export { measurementsRoute, useMeasurementsMode, useSelectedChartIds };
