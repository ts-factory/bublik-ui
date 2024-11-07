/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import { ResultInfoAPIResponse } from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

export const measurementsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getResultInfo: build.query<ResultInfoAPIResponse, string | number>({
			query: (resultId) => withApiV2(`/results/${resultId}`)
		}),
		getSingleMeasurement: build.query<SingleMeasurement, string | number>({
			query: (resultId) => ({
				url: withApiV2(`/results/${resultId}/measurements`)
			})
		}),
		getMeasurements: build.query<SingleMeasurementChart[], (string | number)[]>(
			{
				query: (results) => ({
					url: withApiV2('/measurements/by_result_ids'),
					method: 'POST',
					body: { result_ids: results.map(Number) }
				})
			}
		)
	})
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
