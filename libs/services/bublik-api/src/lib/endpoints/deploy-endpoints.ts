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

export const deployEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getDeployInfo: build.query<DeployInfo, void>({
			queryFn: async (_args, _api, _extraOptions, fetchBaseQuery) => {
				const projectName = fetchBaseQuery(
					withApiV2('/server/project')
				) as MaybePromise<QueryReturnValue<DeployProjectAPIResponse>>;
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
		getPerformanceTimeouts: build.query<PerformanceResponse, void>({
			query: () => ({ url: '/performance_check/' })
		})
	})
};
