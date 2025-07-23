/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import {
	DASHBOARD_MODE,
	DashboardAPIQuery,
	DashboardAPIResponse,
	DashboardMode,
	DashboardModeResponse
} from '@/shared/types';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';
import { BUBLIK_TAG } from '../types';
import { getMinutes } from '../utils';

const getDashboardMode = (days: number, columns: number) => {
	let dashboardMode: DashboardMode;

	if (days === 1 && columns === 1) {
		dashboardMode = DASHBOARD_MODE.Rows;
	} else if (days === 1 && columns === 2) {
		dashboardMode = DASHBOARD_MODE.RowsLine;
	} else if (days === 2 && columns === 2) {
		dashboardMode = DASHBOARD_MODE.Columns;
	} else {
		dashboardMode = DASHBOARD_MODE.RowsLine;
	}

	return dashboardMode;
};

export const dashboardEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getDashboardMode: build.query<DashboardMode, void>({
			query: () => withApiV2('/dashboard/default_mode'),
			transformResponse: (result: DashboardModeResponse) =>
				getDashboardMode(result.mode.days, result.mode.columns),
			keepUnusedDataFor: getMinutes(1440)
		}),
		getDashboardByDate: build.query<
			DashboardAPIResponse,
			DashboardAPIQuery | void
		>({
			query: (queryParams) => {
				let params: Record<string, unknown> | undefined;
				if (typeof queryParams !== 'undefined') {
					params = {
						date: queryParams.date,
						project: queryParams.projects?.[0]
					};
				}

				return {
					url: withApiV2('/dashboard'),
					params,
					cache: 'no-cache'
				};
			},
			providesTags: (_result, _error, arg) => [
				{ type: BUBLIK_TAG.DashboardData },
				{ type: BUBLIK_TAG.DashboardData, id: arg?.date }
			]
		}),
		getRunFallingFreq: build.query<boolean[], number>({
			query: (runId) => withApiV2(`/runs/${runId}/nok_distribution`),
			providesTags: (_result, _error, arg) => [
				{ type: BUBLIK_TAG.DashboardData, id: arg }
			]
		})
	})
};
