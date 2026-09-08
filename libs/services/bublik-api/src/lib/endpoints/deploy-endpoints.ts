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

/**
 * The backend's placeholder for unpopulated deploy info is the literal string
 * 'null' (REPO_REVISIONS in settings.py), so treat it as absent rather than data.
 *
 * Deploy info only feeds a cosmetic version card, so every field is optional and
 * normalised after parsing. Validating it strictly meant one bad field failed the
 * entire getServerVersion query: a 'null' commit_date was rejected by
 * z.coerce.date() and the card rendered Zod's own message -- "API: Invalid date"
 * -- with branch, revision and tag blank too.
 */
const UNSET_PLACEHOLDER = 'null';

const cleanString = (value?: string | null) =>
	value && value !== UNSET_PLACEHOLDER ? value : undefined;

const cleanDate = (value?: string | null) => {
	const raw = cleanString(value);

	if (!raw) return undefined;

	const date = new Date(raw);

	return Number.isNaN(date.getTime()) ? undefined : date;
};

const DeployCommitInfoAPISchema = z.object({
	commit_date: z.string().nullish(),
	commit_rev: z.string().nullish(),
	commit_summary: z.string().nullish()
});

const ServerVersionInfoAPISchema = z.object({
	repo_url: z.string().nullish(),
	repo_branch: z.string().nullish(),
	latest_commit: DeployCommitInfoAPISchema.nullish(),
	repo_tag: z.string().nullish()
});

const VersionSummary = z.object({
	branch: z.string().optional(),
	date: z.date().optional(),
	revision: z.string().optional(),
	summary: z.string().optional(),
	tag: z.string().optional()
});

const ServerFeaturesSchema = z.object({
	analytics_enabled: z.boolean(),
	chat_enabled: z.boolean()
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
				date: cleanDate(version.latest_commit?.commit_date),
				revision: cleanString(version.latest_commit?.commit_rev),
				branch: cleanString(version.repo_branch),
				tag: cleanString(version.repo_tag),
				summary: cleanString(version.latest_commit?.commit_summary)
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
