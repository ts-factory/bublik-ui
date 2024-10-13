/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import {
	ResultInfoAPIResponse,
	MeasurementPlot,
	MeasurementPlotWithoutId
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

const createChartId = (measurement: MeasurementPlotWithoutId, idx: number) => {
	return `${idx}_${measurement.tool}:${measurement.type}:${measurement.name}:${measurement.aggr}`;
};

const addIdToPlot = (
	plot: MeasurementPlotWithoutId,
	idx: number
): MeasurementPlot => {
	return { id: createChartId(plot, idx), ...plot };
};

const transformToMeasurementPlot = (
	plotsWithoutIds: MeasurementPlotWithoutId[]
) => {
	if (!Array.isArray(plotsWithoutIds)) return { plots: [] };

	const plots = plotsWithoutIds.map(addIdToPlot);

	return { plots } as const;
};

export const measurementsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getResultInfo: build.query<ResultInfoAPIResponse, string | number>({
			query: (resultId) => withApiV2(`/results/${resultId}`)
		}),
		getSingleMeasurement: build.query<
			SingleMeasurementResponse,
			string | number
		>({
			query: (resultId) => ({
				url: withApiV2(`/results/${resultId}/measurements`)
			})
		}),
		getMeasurements: build.query<
			{ plots: MeasurementPlot[] },
			(string | number)[]
		>({
			query: (results) => ({
				url: withApiV2('/measurements/by_results_ids'),
				method: 'POST',
				body: { results_ids: results.map(Number) }
			}),
			transformResponse: transformToMeasurementPlot
		})
	})
};

export interface SingleMeasurementResponse {
	charts: SingleMeasurementChart[];
	tables: SingleMeasurementTable[];
}

export interface SingleMeasurementChart {
	id: string;
	title: string;
	subtitle: string;
	axis_x_label: string;
	axis_y_label: string;
	axis_x_key: string;
	axis_y_key: string;
	dataset: Array<Array<number | string>>;
}

export interface SingleMeasurementTable {
	id: string;
	type: string;
	name: string;
	tool: string;
	aggr: string;
	units: string;
	keys: string[];
	comments: string[];
	value: number;
}
