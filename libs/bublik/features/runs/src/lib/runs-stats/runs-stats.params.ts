/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { QueryParamConfig } from 'use-query-params';

import { RUNS_CHART_PERIODS, RunsChartPeriod } from './runs-stats.utils';

const DEFAULT_PERIOD: RunsChartPeriod = 'week';

function isPeriod(value: unknown): value is RunsChartPeriod {
	return RUNS_CHART_PERIODS.includes(value as RunsChartPeriod);
}

/** Week, the old fixed grouping, stays out of the URL */
export const PeriodParam: QueryParamConfig<RunsChartPeriod, RunsChartPeriod> = {
	encode: (period) => (period === DEFAULT_PERIOD ? undefined : period),
	decode: (value) => {
		const period = Array.isArray(value) ? value[0] : value;

		return isPeriod(period) ? period : DEFAULT_PERIOD;
	}
};
