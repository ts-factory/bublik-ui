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

import { BublikBaseQueryFn, withApiV2 } from '../../config';
import { API_REDUCER_PATH } from '../../constants';
import { BUBLIK_TAG } from '../../types';
import { MaybePromise } from '../../utils';

type ImportRunsError = {
	status: string | number;
	data?: unknown;
	title?: string;
	description?: string;
	failedRunIndex?: number;
	failedRunErrors?: ImportRunsError[];
};

type ImportRunsQueryReturnValue<T = unknown> = QueryReturnValue<
	T,
	unknown,
	object | undefined
>;

const buildImportRunSourceUrl = (run: ImportRunInput) => {
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

	return `${withApiV2('/importruns/source/', true)}?${params.toString()}`;
};

function parseImportRuntime(runtime?: string | null): number | null {
	if (!runtime) return null;

	const value = runtime.trim();
	if (!value) return null;

	const parts = value.split(':');
	if (parts.length === 3) {
		const [hours, minutes, seconds] = parts.map(Number);

		if ([hours, minutes, seconds].every(Number.isFinite)) {
			return hours * 3600 + minutes * 60 + seconds;
		}

		return null;
	}

	const seconds = Number(value);
	return Number.isFinite(seconds) ? seconds : null;
}

const withFailedRunIndex = (
	error: unknown,
	failedRunIndex: number
): ImportRunsError => {
	if (typeof error === 'object' && error !== null) {
		return { ...error, failedRunIndex } as ImportRunsError;
	}

	return {
		status: 400,
		data: { messages: [String(error)] },
		failedRunIndex
	};
};

const getImportRunsQueryResult = (
	responses: PromiseSettledResult<ImportRunsQueryReturnValue>[]
): ImportRunsQueryReturnValue<ImportRunsJobResponse[]> => {
	const data: ImportRunsJobResponse[] = [];
	const errors: string[] = [];
	const requestErrors: ImportRunsError[] = [];

	for (const [index, maybe] of responses.entries()) {
		if (maybe.status === 'fulfilled' && maybe.value.data) {
			const parsed = ImportRunsJobResponseSchema.safeParse(maybe.value.data);
			if (parsed.success) {
				data.push(parsed.data);
			} else {
				errors.push('Invalid response from import server');
			}
		} else if (maybe.status === 'fulfilled' && maybe.value.error) {
			requestErrors.push(withFailedRunIndex(maybe.value.error, index));
		} else if (maybe.status === 'rejected') {
			errors.push(String(maybe.reason));
		}
	}

	if (requestErrors.length) {
		const [firstRequestError] = requestErrors;
		return {
			error: {
				...firstRequestError,
				failedRunErrors: requestErrors
			}
		};
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
};

function transformImportTaskListResponse(
	response: z.infer<typeof ImportTaskListRawResponseSchema>
): z.infer<typeof ImportTaskListResponseSchema> {
	return {
		...response,
		results: response.results.map((result) => ({
			...result,
			runtime: parseImportRuntime(result.runtime)
		}))
	};
}

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
			): z.infer<typeof ImportTaskListResponseSchema> =>
				transformImportTaskListResponse(response),
			providesTags: [BUBLIK_TAG.importEvents]
		}),
		importRuns: build.mutation<ImportRunsJobResponse[], ImportRunInput[]>({
			queryFn: async (runUrls, _api, _extraOptions, baseQuery) => {
				const importRunPromises = runUrls.map((run) => {
					const url = buildImportRunSourceUrl(run);

					return baseQuery(url) as MaybePromise<ImportRunsQueryReturnValue>;
				});

				const responses = await Promise.allSettled(importRunPromises);

				return getImportRunsQueryResult(responses);
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

export {
	buildImportRunSourceUrl,
	getImportRunsQueryResult,
	parseImportRuntime,
	transformImportTaskListResponse,
	withFailedRunIndex
};
