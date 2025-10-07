/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder, QueryReturnValue } from '@reduxjs/toolkit/query';
import { camelizeKeys } from 'humps';

import {
	DeployProjectAPIResponse,
	DeployGitInfoAPIResponse,
	DeployInfo,
	DeployGitInfo,
	PerformanceResponse
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';
import { MaybePromise } from '../utils';
import { z } from 'zod';
import { config } from '@/bublik/config';

const TabTitlePrefixResponseSchema = z.object({
	tab_title_prefix: z.string().nullable()
});

export const deployEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getDeployInfo: build.query<DeployInfo, { projects?: number[] } | void>({
			queryFn: async (_args, _api, _extraOptions, fetchBaseQuery) => {
				const projectName = fetchBaseQuery({
					url: withApiV2('/server/project'),
					params:
						typeof _args !== 'undefined'
							? { project: _args.projects?.[0] }
							: undefined
				}) as MaybePromise<QueryReturnValue<DeployProjectAPIResponse>>;
				const gitInfo = fetchBaseQuery(
					withApiV2('/server/version')
				) as MaybePromise<QueryReturnValue<DeployGitInfoAPIResponse>>;

				const [name, git] = await Promise.all([projectName, gitInfo]);

				if (!name.data || !git.data) {
					return {
						error: {
							status: 'CUSTOM_ERROR',
							error: 'Could not get deploy info'
						}
					};
				}

				return {
					data: {
						backendGitInfo: camelizeKeys(git.data) as DeployGitInfo,
						projectName: name.data.project
					}
				};
			}
		}),
		getPerformanceTimeouts: build.query<
			PerformanceResponse,
			{ projects: number[] }
		>({
			query: (query) => ({
				url: '/performance_check/',
				params: { project: query.projects?.[0] }
			})
		}),
		getTabTitlePrefix: build.query({
			query: (query) => ({
				url: withApiV2('/server/tab_title_prefix'),
				params: {
					project_id: query?.projects.length
						? query?.projects?.join(config.queryDelimiter)
						: undefined
				}
			}),
			rawResponseSchema: TabTitlePrefixResponseSchema,
			responseSchema: z.string().nullable(),
			transformResponse: (resp: z.infer<typeof TabTitlePrefixResponseSchema>) =>
				resp.tab_title_prefix,
			argSchema: z.object({ projects: z.array(z.number()) }).optional()
		})
	})
};
