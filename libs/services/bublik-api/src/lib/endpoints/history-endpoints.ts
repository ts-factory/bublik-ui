/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import {
	HistoryAPIBackendQuery,
	HistoryAPIBackendQuerySchema,
	HistoryDataAggregationAPIResponse,
	HistoryLinearAPIResponse,
	HistoryLinearAPIResponseSchema,
	IssueSearchOption
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { configDependent } from '../tags';
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
			argSchema: HistoryAPIBackendQuerySchema,
			responseSchema: HistoryLinearAPIResponseSchema,
			providesTags: () => configDependent(BUBLIK_TAG.HistoryData)
		}),
		getTestSearchOptions: build.query<string[], { project?: number }>({
			query: (query) => {
				const { project } = query;

				return {
					url: withApiV2('/history/test_search_options'),
					params: prepareForSend({ project }),
					cache: 'no-cache'
				};
			},
			providesTags: () => configDependent(BUBLIK_TAG.HistoryData)
		}),
		/**
		 * The issues classifying at least one result of a given test — the issue
		 * filter's options, playing the same role `test_search_options` and
		 * `params_search_options` play for theirs.
		 *
		 * `test_name` is required, not optional: the endpoint 400s without one,
		 * which is why the filter only opens once a test has been chosen.
		 */
		getIssueSearchOptions: build.query<
			IssueSearchOption[],
			{ testName: string; project?: number }
		>({
			query: ({ testName, project }) => ({
				url: withApiV2('/history/issue_search_options'),
				params: prepareForSend({ test_name: testName, project }),
				cache: 'no-cache'
			}),
			providesTags: () => [BUBLIK_TAG.HistoryData, BUBLIK_TAG.Issues]
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
			providesTags: () => configDependent(BUBLIK_TAG.HistoryData)
		})
	})
};
