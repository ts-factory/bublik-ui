/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, enumOf, repeatedNum, type InferSearch } from '@/router';

/**
 * `/runs/$runId/results/$resultId/measurements`. Links always
 * write `mode=default` explicitly; the sidebar strips it from stored URLs.
 */
const measurementsSearch = defineSearch(
	{
		mode: enumOf(['default', 'charts', 'tables', 'split', 'overlay']),
		selectedCharts: repeatedNum()
	},
	{ mode: 'default', selectedCharts: [] }
);

type MeasurementsSearch = InferSearch<typeof measurementsSearch>;

export { measurementsSearch };
export type { MeasurementsSearch };
