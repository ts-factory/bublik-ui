/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { To } from './path/to';

import {
	IssueConfig,
	IssuesConfig,
	RunConfig,
	RunIssuesConfig,
	LogConfig,
	MeasurementsConfig
} from './types';
import { LogPageMode } from '@/shared/types';

export type RouteConfig<T> = {
	getPathname?: (config: T) => string;
	getSearch?: (config: T) => string;
	getHash?: (config: T) => string;
};

const buildRoute =
	<T>(config: RouteConfig<T> = {}) =>
	(route: T): To => {
		return {
			pathname: config.getPathname?.(route),
			search: config.getSearch?.(route),
			hash: config.getHash?.(route)
		};
	};

export const routes = {
	run: buildRoute<RunConfig>({
		getPathname: ({ runId }) => `/runs/${runId}`,
		getSearch: ({ targetIterationId, resultFilter }) => {
			const params = new URLSearchParams();
			if (targetIterationId) {
				params.set('targetIterationId', String(targetIterationId));
			}
			if (resultFilter) params.set('resultFilter', resultFilter);
			return params.toString();
		}
	}),
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
	issues: buildRoute<IssuesConfig>({ getPathname: () => `/issues` }),
	issue: buildRoute<IssueConfig>({
		getPathname: ({ issueId }) => `/issues/${issueId}`
	}),
	issueResults: buildRoute<IssueConfig>({
		getPathname: ({ issueId }) => `/issues/${issueId}/results`
	}),
	runIssues: buildRoute<RunIssuesConfig>({
		getPathname: ({ runId }) => `/runs/${runId}/issues`
	})
} as const;
