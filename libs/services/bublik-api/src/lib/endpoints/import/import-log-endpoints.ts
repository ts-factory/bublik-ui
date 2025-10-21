/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder, QueryReturnValue } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import {
	ImportEventResponse,
	ImportRunInput,
	ImportJsonLog,
	LogRawApiResponseSchema,
	LogQuerySchema,
	LogEventResponseSchema
} from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';
import { config } from '@/bublik/config';

import { BublikBaseQueryFn, withApiV2 } from '../../config';
import { API_REDUCER_PATH } from '../../constants';
import { BUBLIK_TAG } from '../../types';
import { getUrl, runToImportUrl } from './parse-import-url';
import { MaybePromise } from '../../utils';

export const importLogEventsEndpoint = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getImportEventLog: build.query({
			query: (query) => ({
				url: withApiV2('/session_import'),
				params: {
					...query,
					date: query.date ? formatTimeToAPI(query.date) : undefined
				},
				cache: 'no-cache'
			}),
			argSchema: LogQuerySchema,
			responseSchema: LogEventResponseSchema,
			rawResponseSchema: LogRawApiResponseSchema,
			transformResponse: (
				response: z.infer<typeof LogRawApiResponseSchema>
			): z.infer<typeof LogEventResponseSchema> => ({
				...response,
				results: response.results.map((result) => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const latest = result.at(0)!;
					const other = result.slice(0);
					const maybeRunId = result.find(
						(item) => item?.run_id !== undefined
					)?.run_id;

					return {
						...latest,
						children: other,
						run_id: maybeRunId
					};
				})
			}),
			providesTags: [BUBLIK_TAG.importEvents]
		}),
		importRuns: build.mutation<ImportEventResponse[], ImportRunInput[]>({
			queryFn: async (runUrls, _api, _extraOptions, baseQuery) => {
				const importRunPromises = runUrls.map((run) => {
					const importUrl = runToImportUrl(run);

					/**
					 * For some reason base query here doesn't respect passed config base url in getApiConfig function
					 * We need to add it manually
					 */
					const url = withApiV2(`/importruns/source/${importUrl}`, true);

					return baseQuery(`${config.rootUrl}${url}`) as MaybePromise<
						QueryReturnValue<{ celery_task_id: string }>
					>;
				});

				const responses = await Promise.allSettled(importRunPromises);

				const data = responses.map((maybe, idx) => {
					const maybeRunUrl = runUrls?.[idx];
					const url = maybeRunUrl ? getUrl(maybeRunUrl).toString() : 'unknown';

					if (maybe.status === 'fulfilled' && maybe.value.data) {
						const taskId = maybe.value.data.celery_task_id;

						return { taskId, url };
					}

					return { url, taskId: null };
				});

				return { data };
			},
			invalidatesTags: [BUBLIK_TAG.importEvents]
		}),
		getImportLog: build.query<ImportJsonLog[], string>({
			query: (celery_task_id: string) => ({
				url: withApiV2(`/importruns/log/?task_id=${celery_task_id}`, true),
				cache: 'no-cache'
			})
		})
	})
};
