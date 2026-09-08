/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { RunDataResults } from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { configDependent } from '../tags';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

export const measurementsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getResultInfo: build.query<RunDataResults, string | number>({
			// `cache: 'no-cache'` throughout: the server stamps
			// `Cache-Control: max-age=600` on API GETs, so without it a refetch
			// triggered by a config change is answered from the browser cache
			// with the pre-change body.
			query: (resultId) => ({
				url: withApiV2(`/results/${resultId}`),
				cache: 'no-cache'
			}),
			transformResponse: (response: { result: RunDataResults }) =>
				response.result,
			providesTags: configDependent(BUBLIK_TAG.Run)
		}),
		getSingleMeasurement: build.query<SingleMeasurement, string | number>({
			query: (resultId) => ({
				url: withApiV2(`/results/${resultId}/measurements`),
				cache: 'no-cache'
			}),
			providesTags: configDependent(BUBLIK_TAG.Run)
		}),
		getMeasurements: build.query<
			HistoryMeasurementResult[],
			(string | number)[]
		>({
			query: (results) => ({
				url: withApiV2('/measurements/by_result_ids'),
				method: 'POST',
				body: { result_ids: results.map(Number) }
			}),
			transformResponse: (resp: HistoryMeasurementResult[]) =>
				resp.filter((v) => v.measurement_series_charts.length),
			providesTags: configDependent(BUBLIK_TAG.Run)
		}),
		getTrendCharts: build.query<SingleMeasurementChart[], (string | number)[]>({
			query: (results) => ({
				url: withApiV2('/measurements/trend_charts'),
				method: 'POST',
				body: { result_ids: results.map(Number) }
			}),
			providesTags: configDependent(BUBLIK_TAG.Run)
		})
	})
};

export type RawHistoryCharts = {
	trend_charts: SingleMeasurementChart[];
	measurement_series_charts_by_result: HistoryMeasurementResult[];
};

export type HistoryMeasurementResult = {
	id: number;
	start: string;
	test_name: string;
	run_id: number;
	result_id: number;
	parameters_list: string[];
	measurement_series_charts: SingleMeasurementChart[];
};

export interface SingleMeasurement {
	run_id: number;
	iteration_id: number;
	charts: SingleMeasurementChart[];
	tables: SingleMeasurementTable[];
}

export interface SingleMeasurementChart {
	id: number;
	title: string;
	subtitle: string;
	axis_x: { key: string; label: string };
	axis_y: { key: string; label: string };
	dataset: (string | number)[][];
}

export interface SingleMeasurementTable {
	measurement_id: number;
	type: string;
	name: string;
	tool: string;
	aggr: string;
	units: string;
	keys: string[];
	comments: string[];
	value: number;
}
