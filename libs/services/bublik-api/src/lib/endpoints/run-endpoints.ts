/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';

import {
	RunSourceAPIRResponse,
	RunData,
	RunDataResults,
	ResultTableAPIQueryWithFilter,
	ResultDetailsAPIResponse,
	CompromisedTagsResponse,
	RunDetailsAPIResponse,
	CompromisedDeleteResponse,
	CompromisedPostResponse,
	CompromisedBody
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { getMinutes, prepareForSend } from '../utils';
import { transformRunTable } from '../transform';
import { API_REDUCER_PATH } from '../constants';
import { BublikBaseQueryFn, withApiV2 } from '../config';

export const runEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getRunSource: build.query<RunSourceAPIRResponse, string>({
			query: (runId) => ({ url: withApiV2(`/runs/${runId}/source`) }),
			keepUnusedDataFor: getMinutes(15)
		}),
		getRunTableByRunId: build.query<RunData[] | null, string>({
			query: (runId) => ({ url: withApiV2(`/runs/${runId}/stats`) }),
			keepUnusedDataFor: getMinutes(5),
			transformResponse: transformRunTable
		}),
		getResultsTable: build.query<
			RunDataResults[],
			ResultTableAPIQueryWithFilter
		>({
			async queryFn(query, _queryApi, _extraOptions, fetchWithBQ) {
				try {
					const DEFAULT_PAGE_SIZE = 5000;
					const DEFAULT_PAGE = 1;

					const testName = query.testName;
					const parentId = query.parentId;

					const requests = Object.entries(query.requests).map(
						([_columnId, props]) => {
							const results = props.results.join(';');
							const resultProperties = props.resultProperties.join(';');
							const pageAndPageSize = `page=${DEFAULT_PAGE}&page_size=${DEFAULT_PAGE_SIZE}`;

							return fetchWithBQ(
								withApiV2(
									`/results/?parent_id=${parentId}&test_name=${testName}&results=${results}&result_properties=${resultProperties}&${pageAndPageSize}`,
									true
								)
							);
						}
					);

					const requestsResults = (await Promise.all(
						requests
					)) as QueryReturnValue<ResultDetailsAPIResponse>[];

					const checkedIds = new Set<number>();
					const data = requestsResults
						.map((result) => result?.data?.results || [])
						.reduce((acc, curr) => [...acc, ...curr], [])
						.filter((item) => {
							const isDuplicate = checkedIds.has(item.result_id);
							checkedIds.add(item.result_id);
							return !isDuplicate;
						})
						.sort(
							(a, b) =>
								new Date(a.start).getTime() - new Date(b.start).getTime()
						);

					return { data };
				} catch (error) {
					return {
						error: {
							originalStatus: 500,
							error: 'Something went wrong',
							status: 'CUSTOM_ERROR'
						}
					};
				}
			}
		}),
		getCompromisedTags: build.query<CompromisedTagsResponse, void>({
			query: () => withApiV2('/outside_domains/logs')
		}),
		getRunDetails: build.query<RunDetailsAPIResponse, string | number>({
			query: (runId) => ({
				url: withApiV2(`/runs/${runId}/details`),
				cache: 'reload'
			}),
			providesTags: (_result, _error, runId) => [
				{ type: BUBLIK_TAG.RunDetails, id: runId }
			]
		}),
		deleteCompromisedStatus: build.mutation<
			CompromisedDeleteResponse,
			string | number
		>({
			query: (runId) => ({
				url: withApiV2(`/runs/${runId}/compromised`),
				method: 'DELETE'
			}),
			invalidatesTags: (_result, _error, runId) => [
				{ type: BUBLIK_TAG.RunDetails, id: runId }
			]
		}),
		markAsCompromised: build.mutation<CompromisedPostResponse, CompromisedBody>(
			{
				query: (body: CompromisedBody) => ({
					url: withApiV2(`/runs/${body.runId}/compromised`),
					method: 'POST',
					body: prepareForSend(body)
				}),
				invalidatesTags: (_result, _error, { runId }) => [
					{ type: BUBLIK_TAG.RunDetails, id: runId }
				]
			}
		)
	})
};
