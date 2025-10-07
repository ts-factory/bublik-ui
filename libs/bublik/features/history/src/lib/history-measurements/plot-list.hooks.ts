/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */

import { skipToken } from '@reduxjs/toolkit/query';

import {
	bublikAPI,
	createBublikError,
	useGetHistoryLinearQuery,
	useGetMeasurementsQuery
} from '@/services/bublik-api';
import { HISTORY_MAX_RESULTS_IDS } from '@/bublik/config';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import { useHistoryQuery } from '../hooks';
import { useCombinedCharts } from './combined-charts.context';

function useGetHistoryMeasurementsByResult() {
	const { query } = useHistoryQuery();

	const {
		data: linearData,
		isLoading: isLinearLoading,
		isFetching: isLinearFetching,
		isError: isLinearError,
		error: linearError
	} = useGetHistoryLinearQuery(query.testName ? query : skipToken);

	const {
		data,
		isLoading: isChartsLoading,
		isFetching: isChartsFetching,
		isError: isChartsError,
		error: chartsError
	} = useGetMeasurementsQuery(linearData ? linearData.results_ids : skipToken);

	const isLoading = isLinearLoading || isChartsLoading;
	const isError = isChartsError || isLinearError;
	const isFetching = isLinearFetching || isChartsFetching;
	const resultIds = linearData?.results_ids;
	const error =
		linearData && linearData.results_ids.length > HISTORY_MAX_RESULTS_IDS
			? createBublikError({
					status: 400,
					title: 'Result ids limit',
					description:
						"Number of result ID's is larger than limit. Please be more specific with your search query"
			  })
			: chartsError || linearError;

	return { data, isLoading, isError, resultIds, isFetching, error } as const;
}

function useGetHistoryMeasurements() {
	const { query } = useHistoryQuery();

	const {
		data: linearData,
		isLoading: isLinearLoading,
		isFetching: isLinearFetching,
		isError: isLinearError,
		error: linearError
	} = useGetHistoryLinearQuery(query.testName ? query : skipToken);

	const {
		data,
		isLoading: isChartsLoading,
		isFetching: isChartsFetching,
		isError: isChartsError,
		error: chartsError
	} = bublikAPI.useGetTrendChartsQuery(
		linearData ? linearData.results_ids : skipToken
	);

	const isLoading = isLinearLoading || isChartsLoading;
	const isError = isChartsError || isLinearError;
	const isFetching = isLinearFetching || isChartsFetching;
	const resultIds = linearData?.results_ids;
	const error =
		linearData && linearData.results_ids.length > HISTORY_MAX_RESULTS_IDS
			? createBublikError({
					status: 400,
					title: 'Result ids limit',
					description:
						"Number of result ID's is larger than limit. Please be more specific with your search query"
			  })
			: chartsError || linearError;

	return { data, isLoading, isError, resultIds, isFetching, error } as const;
}

function useCombinedView() {
	return useCombinedCharts();
}

function useHistoryMeasurementsTitle(testName?: string) {
	useTabTitleWithPrefix([testName, 'Measurements - History - Bublik']);
}

export {
	useGetHistoryMeasurements,
	useCombinedView,
	useHistoryMeasurementsTitle,
	useGetHistoryMeasurementsByResult
};
