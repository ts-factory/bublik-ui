/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';

import {
	HistoryDefaultResultAPIResponse,
	ResultLogAPIResponse,
	RootBlock,
	TreeDataAPIResponse
} from '@/shared/types';

import { transformLogTree } from '../transform';
import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';
import {
	BublikError,
	BublikHttpError,
	isBublikParsableError
} from '../error-handling';

type GetLogJsonInputs = {
	id: string | number;
	page?: string | number | null;
};

export const constructJsonUrl = (input: GetLogJsonInputs): string => {
	const PREFIX = '/api/v2';

	if (!input.page) return `${PREFIX}/logs/${input.id}/json/`;

	let result = `${PREFIX}/logs/${input.id}/json`;

	if (input.page) result += `/?page=${input.page}`;

	return result;
};

export const logEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getTreeByRunId: build.query<TreeDataAPIResponse | null, string>({
			query: (runId) => withApiV2(`/tree/${runId}`),
			transformResponse: transformLogTree
		}),
		getLogUrlByResultId: build.query<ResultLogAPIResponse, number>({
			query: (resultId) => withApiV2(`/logs/${resultId}/html`)
		}),
		getHistoryLinkDefaults: build.query<
			HistoryDefaultResultAPIResponse,
			number | string
		>({ query: (resultId) => withApiV2(`/results/${resultId}`) }),
		getLogJson: build.query<RootBlock, GetLogJsonInputs>({
			queryFn: async ({ page, id }, _api, _extraOptions, baseQuery) => {
				const fetchJson = async (externalUrl: string) => {
					const getBublikFromStatusCode = (
						response: Response
					): BublikHttpError => {
						return { status: response.status };
					};

					const options: RequestInit = { credentials: 'include' };

					const response = await fetch(externalUrl, options);

					if (!response.ok) throw getBublikFromStatusCode(response);

					return response.json();
				};
				const getUrl = constructJsonUrl({ page, id });

				const jsonUrl = (await baseQuery(getUrl)) as QueryReturnValue<{
					url: string;
				}>;

				if (jsonUrl.error) throw jsonUrl.error;

				if (!jsonUrl.data) {
					// eslint-disable-next-line no-throw-literal
					throw {
						status: 404,
						title: 'No data',
						description: 'No json data found in response'
					};
				}

				try {
					const blocksJson = await fetchJson(jsonUrl.data.url);

					return { data: blocksJson };
				} catch (e) {
					console.error(e);

					const defaultError: BublikError = {
						status: 400,
						title: 'Something went wrong',
						description:
							'We are not sure what exactly went wrong, please report'
					};

					if (isBublikParsableError(e)) return { error: e };

					return { error: defaultError };
				}
			}
		})
	})
};
