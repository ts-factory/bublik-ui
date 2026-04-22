/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder, QueryReturnValue } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import {
	ImportRunInput,
	ImportRunsJobResponse,
	ImportRunsJobResponseSchema,
	ImportJsonLog,
	ImportJsonLogResponseSchema,
	ImportTaskListRawResponseSchema,
	ImportTaskListResponseSchema,
	ImportTaskFiltersSchema
} from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';
import { config } from '@/bublik/config';

import { BublikBaseQueryFn, withApiV2 } from '../../config';
import { API_REDUCER_PATH } from '../../constants';
import { BUBLIK_TAG } from '../../types';
import { MaybePromise } from '../../utils';

export const importLogEventsEndpoint = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getImportEventLog: build.query({
			query: (query) => ({
				url: withApiV2('/session_import'),
				params: query,
				cache: 'no-cache'
			}),
			argSchema: ImportTaskFiltersSchema,
			responseSchema: ImportTaskListResponseSchema,
			rawResponseSchema: ImportTaskListRawResponseSchema,
			transformResponse: (
				response: z.infer<typeof ImportTaskListRawResponseSchema>
			): z.infer<typeof ImportTaskListResponseSchema> => ({
				...response,
				results: response.results.map((result) => ({
					...result,
					runtime: result.runtime ? parseFloat(result.runtime) : null
				}))
			}),
			providesTags: [BUBLIK_TAG.importEvents]
		}),
		importRuns: build.mutation<ImportRunsJobResponse[], ImportRunInput[]>({
			queryFn: async (runUrls, _api, _extraOptions, baseQuery) => {
				const importRunPromises = runUrls.map((run) => {
					const params = new URLSearchParams();
					params.set('url', run.url);
					if (run.range?.startDate) {
						params.set('from', formatTimeToAPI(run.range.startDate));
					}
					if (run.range?.endDate) {
						params.set('to', formatTimeToAPI(run.range.endDate));
					}
					if (run.force) {
						params.set('force', 'true');
					}
					if (run.project != null) {
						params.set('project', String(run.project));
					}

					const url = `${withApiV2(
						'/importruns/source/',
						true
					)}?${params.toString()}`;

					return baseQuery(`${config.rootUrl}${url}`) as MaybePromise<
						QueryReturnValue<unknown>
					>;
				});

				const responses = await Promise.allSettled(importRunPromises);

				const data: ImportRunsJobResponse[] = [];
				const errors: string[] = [];

				for (const maybe of responses) {
					if (maybe.status === 'fulfilled' && maybe.value.data) {
						const parsed = ImportRunsJobResponseSchema.safeParse(
							maybe.value.data
						);
						if (parsed.success) {
							data.push(parsed.data);
						} else {
							errors.push('Invalid response from import server');
						}
					} else if (maybe.status === 'rejected') {
						errors.push(String(maybe.reason));
					}
				}

				if (errors.length) {
					return {
						error: {
							status: 400,
							title: 'Import failed',
							description: errors.join('; ')
						}
					};
				}

				return { data };
			},
			invalidatesTags: [BUBLIK_TAG.importEvents]
		}),
		getImportLog: build.query<ImportJsonLog[], string>({
			query: (celery_task_id: string) => ({
				url: withApiV2(`/importruns/log/?task_id=${celery_task_id}`, true),
				cache: 'no-cache'
			}),
			responseSchema: z.array(ImportJsonLogResponseSchema)
		})
	})
};
