/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import {
	HistoryAPIQuery,
	HistoryDataAggregationAPIResponse,
	HistoryLinearAPIResponse
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { prepareForSend } from '../utils';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

export const historyEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getHistoryLinear: build.query<HistoryLinearAPIResponse, HistoryAPIQuery>({
			query: (query) => {
				return { url: withApiV2('/history'), params: prepareForSend(query) };
			},
			providesTags: () => [{ type: BUBLIK_TAG.HistoryData }]
		}),
		getHistoryAggregation: build.query<
			HistoryDataAggregationAPIResponse,
			HistoryAPIQuery
		>({
			query: (query) => {
				return {
					url: withApiV2('/history/grouped'),
					params: prepareForSend(query)
				};
			},
			providesTags: () => [{ type: BUBLIK_TAG.HistoryData }]
		})
	})
};
