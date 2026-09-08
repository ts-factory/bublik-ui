/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { ReportRoot } from '@/shared/types';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { configDependent } from '../tags';
import { API_REDUCER_PATH } from '../constants';

export interface RunReportConfigResponse {
	run_report_configs: RunReportConfig[];
}

export interface RunReportConfig {
	id: number;
	name: string;
	description: string;
	created: string;
	version: number;
}

export interface InvalidReportConfigFile {
	file: string;
	reason: string;
}

export const reportEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getRunReportConfigs: build.query<RunReportConfigResponse, string | number>({
			// A report *is* a config, so both queries here have to refetch when
			// one is saved. `cache: 'no-cache'` because the server stamps
			// `Cache-Control: max-age=600` on API GETs, which would otherwise
			// answer the refetch from the browser cache.
			query: (runId) => ({
				url: withApiV2(`/report/${runId}/configs`),
				cache: 'no-cache'
			}),
			providesTags: configDependent(BUBLIK_TAG.Run)
		}),
		getRunReport: build.query<
			ReportRoot,
			{ runId: string | number; configId: string | number }
		>({
			query: ({ runId, configId }) => ({
				url: withApiV2(`/report/${runId}/?config=${configId}`, true),
				cache: 'no-cache'
			}),
			providesTags: configDependent(BUBLIK_TAG.Run)
		})
	})
};
