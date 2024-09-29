/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import { ReportRoot } from '@/shared/types';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
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
			query: (runId) => withApiV2(`/report/${runId}/configs`)
		}),
		getRunReport: build.query<
			ReportRoot,
			{ runId: string | number; configId: string | number }
		>({
			query: ({ runId, configId }) =>
				withApiV2(`/report/${runId}/?config=${configId}`, true)
		})
	})
};
