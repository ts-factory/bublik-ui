/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { PerformanceResponseSchema } from '@/shared/types';
import { config } from '@/bublik/config';

import { BUBLIK_TAG } from '../types';
import { configDependent } from '../tags';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

const TabTitlePrefixResponseSchema = z.object({
	tab_title_prefix: z.string().nullable()
});

const DeployCommitInfoAPISchema = z.object({
	commit_date: z.coerce.date(),
	commit_rev: z.string(),
	commit_summary: z.string().optional()
});

const ServerVersionInfoAPISchema = z.object({
	repo_url: z.string().optional(),
	repo_branch: z.string().optional(),
	latest_commit: DeployCommitInfoAPISchema,
	repo_tag: z.string().optional()
});

const VersionSummary = z.object({
	branch: z.string().optional(),
	date: z.date(),
	revision: z.string(),
	summary: z.string().optional(),
	tag: z.string().optional()
});

const ServerFeaturesSchema = z.object({
	analytics_enabled: z.boolean()
});

export type VersionSummary = z.infer<typeof VersionSummary>;

export const deployEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getServerVersion: build.query({
			query: () => ({ url: withApiV2('/server/version') }),
			providesTags: [BUBLIK_TAG.DeployInfo],
			rawResponseSchema: ServerVersionInfoAPISchema,
			responseSchema: VersionSummary,
			transformResponse: (version) => ({
				date: version.latest_commit.commit_date,
				revision: version.latest_commit.commit_rev,
				branch: version.repo_branch,
				tag: version.repo_tag,
				summary: version.latest_commit.commit_summary
			}),
			argSchema: z.void()
		}),
		getPerformanceTimeouts: build.query({
			query: (query) => {
				const params = query?.projects?.length
					? { projects: query?.projects[0] }
					: undefined;

				// `cache: 'no-cache'` here and below: the server stamps
				// `Cache-Control: max-age=600` on API GETs, so without it a
				// refetch triggered by a config change is answered from the
				// browser cache with the pre-change body.
				return { url: '/performance_check/', params, cache: 'no-cache' };
			},
			argSchema: z.object({ projects: z.array(z.number()) }).optional(),
			responseSchema: PerformanceResponseSchema,
			providesTags: configDependent()
		}),
		getTabTitlePrefix: build.query({
			query: (query) => {
				const params = {
					project_id: query?.projects.length
						? query?.projects?.join(config.queryDelimiter)
						: undefined
				};

				return {
					url: withApiV2('/server/tab_title_prefix'),
					params,
					cache: 'no-cache'
				};
			},
			rawResponseSchema: TabTitlePrefixResponseSchema,
			responseSchema: z.string().nullable(),
			transformResponse: (resp) => resp.tab_title_prefix,
			argSchema: z.object({ projects: z.array(z.number()) }).optional(),
			providesTags: configDependent()
		}),
		getServerFeatures: build.query({
			query: () => ({
				url: withApiV2('/server/features'),
				cache: 'no-cache'
			}),
			argSchema: z.void(),
			responseSchema: ServerFeaturesSchema,
			providesTags: configDependent()
		})
	})
};
