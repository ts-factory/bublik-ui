/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { To } from 'react-router-dom';

import {
	DashboardConfig,
	RunConfig,
	LogConfig,
	MeasurementsConfig,
	HistoryConfig
} from './types';
import { LogPageMode } from '@/shared/types';

export type RouteConfig<T> = {
	getPathname?: (config: T) => string;
	getSearch?: (config: T) => string;
	getHash?: (config: T) => string;
};

const buildRoute =
	<T>(config: RouteConfig<T> | string = {}) =>
	(route: T): To => {
		if (typeof config === 'string') return route as To;

		return {
			pathname: config.getPathname?.(route),
			search: config.getSearch?.(route),
			hash: config.getHash?.(route)
		};
	};

export const routes = {
	dashboard: buildRoute<DashboardConfig>({ getPathname: () => `/dashboard` }),
	run: buildRoute<RunConfig>({
		getPathname: ({ runId }) => `/runs/${runId}`,
		getSearch: ({ targetIterationId }) =>
			targetIterationId ? `targetIterationId=${targetIterationId}` : ''
	}),
	history: buildRoute<HistoryConfig>({ getPathname: () => `/history` }),
	log: buildRoute<LogConfig>({
		getPathname: ({ runId }) => `/log/${runId}`,
		getSearch: ({ mode = LogPageMode.TreeAndInfoAndLog, focusId }) => {
			return `${focusId ? `focusId=${focusId}` : ''}${
				mode && focusId ? `&mode=${mode}` : mode ? `?mode=${mode}` : ''
			}`;
		}
	}),
	measurements: buildRoute<MeasurementsConfig>({
		getPathname: ({ runId, resultId }) =>
			`/runs/${runId}/results/${resultId}/measurements`,
		getSearch: () => 'mode=default'
	}),
	runs: buildRoute<never>('/runs'),
	flower: buildRoute('/flower'),
	tests: buildRoute('/tests'),
	developers: buildRoute('/developers'),
	account: buildRoute('/account'),
	import: buildRoute('/import')
} as const;
