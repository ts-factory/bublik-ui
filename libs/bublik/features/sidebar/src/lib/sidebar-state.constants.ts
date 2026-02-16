/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { SIDEBAR_PREFIX as SHARED_SIDEBAR_PREFIX } from '@/shared/types';

export const SIDEBAR_PREFIX = SHARED_SIDEBAR_PREFIX;

export const RUNS_SIDEBAR_KEYS = {
	SELECTED: `${SIDEBAR_PREFIX}.runs.selected`,
	LAST_LIST: `${SIDEBAR_PREFIX}.runs.lastList`,
	LAST_CHARTS: `${SIDEBAR_PREFIX}.runs.lastCharts`,
	LAST_COMPARE: `${SIDEBAR_PREFIX}.runs.lastCompare`,
	LAST_MULTIPLE: `${SIDEBAR_PREFIX}.runs.lastMultiple`,
	LAST_MODE: `${SIDEBAR_PREFIX}.runs.lastMode`
} as const;

export type RunsMode = 'list' | 'charts' | 'compare' | 'multiple';

export const RUN_SIDEBAR_KEYS = {
	LAST_DETAILS: `${SIDEBAR_PREFIX}.run.lastDetails`,
	LAST_REPORT: `${SIDEBAR_PREFIX}.run.lastReport`,
	LAST_MODE: `${SIDEBAR_PREFIX}.run.lastMode`
} as const;

export type RunMode = 'details' | 'report';

export const MEASUREMENTS_SIDEBAR_KEYS = {
	LAST_MEASUREMENTS: `${SIDEBAR_PREFIX}.measurements.lastMeasurements`,
	LAST_MODE: `${SIDEBAR_PREFIX}.measurements.lastMode`
} as const;

export type MeasurementsSidebarMode =
	| 'default'
	| 'charts'
	| 'tables'
	| 'split'
	| 'overlay';

export const LOG_SIDEBAR_KEYS = {
	LAST_LOG: `${SIDEBAR_PREFIX}.log.lastLog`,
	LAST_MODE: `${SIDEBAR_PREFIX}.log.lastMode`
} as const;

export type LogSidebarMode =
	| 'log'
	| 'infoAndlog'
	| 'treeAndinfoAndlog'
	| 'treeAndlog';

export const HISTORY_SIDEBAR_KEYS = {
	LAST_LINEAR: `${SIDEBAR_PREFIX}.history.lastLinear`,
	LAST_AGGREGATION: `${SIDEBAR_PREFIX}.history.lastAggregation`,
	LAST_TREND: `${SIDEBAR_PREFIX}.history.lastTrend`,
	LAST_SERIES: `${SIDEBAR_PREFIX}.history.lastSeries`,
	LAST_STACKED: `${SIDEBAR_PREFIX}.history.lastStacked`,
	LAST_MODE: `${SIDEBAR_PREFIX}.history.lastMode`
} as const;

export type HistorySidebarMode =
	| 'linear'
	| 'aggregation'
	| 'trend'
	| 'series'
	| 'stacked';

export const SHARED_SIDEBAR_KEYS = {
	CURRENT_RUN_ID: `${SIDEBAR_PREFIX}.shared.currentRunId`,
	LAST_LOG_RUN_ID: `${SIDEBAR_PREFIX}.shared.lastLogRunId`,
	LAST_RUN_RUN_ID: `${SIDEBAR_PREFIX}.shared.lastRunRunId`
} as const;

export const DASHBOARD_SIDEBAR_KEYS = {
	LAST_URL: `${SIDEBAR_PREFIX}.dashboard.lastUrl`
} as const;
