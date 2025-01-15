/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { MaybePromise } from '@reduxjs/toolkit/dist/query/tsHelpers';
import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';

import {
	ImportEventResponse,
	ImportRunInput,
	LogApiResponse,
	LogQuery,
	ImportJsonLog
} from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';
import { config } from '@/bublik/config';

import { BublikBaseQueryFn, withApiV2 } from '../../config';
import { API_REDUCER_PATH } from '../../constants';
import { BUBLIK_TAG } from '../../types';
import { getUrl, runToImportUrl } from './parse-import-url';

export const importLogEventsEndpoint = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getImportEventLog: build.query<LogApiResponse, LogQuery>({
			query: (query) => ({
				url: withApiV2('/session_import'),
				params: {
					...query,
					date: query.date ? formatTimeToAPI(query.date) : undefined
				},
				cache: 'no-cache'
			}),
			transformResponse: (response: LogApiResponse) =>
				response.slice().reverse()
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
			}
		}),
		getImportLog: build.query<ImportJsonLog[], string>({
			query: (celery_task_id: string) => ({
				url: withApiV2(`/importruns/log/?task_id=${celery_task_id}`, true)
			})
		})
	})
};
