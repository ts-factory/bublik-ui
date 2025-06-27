/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import {
	HistoryAPIBackendQuery,
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
		getHistoryLinear: build.query<
			HistoryLinearAPIResponse,
			HistoryAPIBackendQuery
		>({
			query: (query) => {
				const { projects, ...rest } = query;
				const params = { ...rest, project: projects?.[0] };

				return {
					url: withApiV2('/history'),
					params: prepareForSend(params),
					cache: 'no-cache'
				};
			},
			providesTags: () => [BUBLIK_TAG.HistoryData]
		}),
		getHistoryAggregation: build.query<
			HistoryDataAggregationAPIResponse,
			HistoryAPIBackendQuery
		>({
			query: (query) => {
				const { projects, ...rest } = query;
				const params = { ...rest, project: projects?.[0] };

				return {
					url: withApiV2('/history/grouped'),
					params: prepareForSend(params),
					cache: 'no-cache'
				};
			},
			providesTags: () => [BUBLIK_TAG.HistoryData]
		})
	})
};
