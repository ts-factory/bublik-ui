/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import { createNextState } from '@reduxjs/toolkit';

import {
	GetLogJsonInputs,
	HistoryDefaultResultAPIResponse,
	ResultLogAPIResponse,
	RootBlock,
	TreeDataAPIResponse
} from '@/shared/types';
import { transformLogTree } from '@/shared/utils';

import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';
import {
	BublikError,
	BublikHttpError,
	isBublikParsableError
} from '../error-handling';
import { ResultsAndVerdictsForIteration } from './run-endpoints';

const RawLogArtifact = z.object({
	type: z.literal('text').describe('type of artifact'),
	view_type: z
		.literal('inline')
		.describe('inline means open in new browser tab'),
	name: z.string().describe('name of artifact'),
	description: z
		.string()
		.optional()
		.describe('optional description of artifact'),
	download_enabled: z
		.boolean()
		.optional()
		.default(false)
		.describe('should show button to download artifact'),
	path: z
		.string()
		.optional()
		.describe('path of artifact relative to artifacts.json'),
	uri: z
		.string()
		.optional()
		.describe(
			'uri of artifact, if it is not relative to artifacts.json or external'
		)
});

const LogArtifact = z.discriminatedUnion('type', [RawLogArtifact]);

export type LogArtifactType = z.infer<typeof LogArtifact>['type'];

export type GetLogArtifactByType<T extends LogArtifactType> = z.infer<
	typeof LogArtifact
> extends { type: T }
	? z.infer<typeof LogArtifact>
	: never;

const ArtifactsSchema = z
	.object({
		version: z.number().describe('version of artifacts.json'),
		artifacts: z.array(LogArtifact).describe('list of artifacts')
	})
	.describe('artifacts.json schema');

type ArtifactsJsonResponse = {
	artifact_base_url: string;
	data: z.infer<typeof ArtifactsSchema>;
};

const ArtifactsSchemaJson = zodToJsonSchema(ArtifactsSchema);
console.log(ArtifactsSchemaJson);

function getArtifactBaseUrl(artifactsUrl: string): string {
	try {
		const url = new URL(artifactsUrl);

		if (url.pathname.includes('/proxy/')) {
			const originalUrl = new URL(url.searchParams.get('url') || '');
			return originalUrl.href.replace(/\/artifacts\.json$/, '');
		}

		return artifactsUrl.replace(/\/artifacts\.json$/, '');
	} catch (e) {
		return artifactsUrl;
	}
}

type LogUrlResponse = {
	url: string;
	artifacts_url: string;
};

export const constructJsonUrl = (input: GetLogJsonInputs): string => {
	const PREFIX = '/api/v2';

	if (!input.page) return `${PREFIX}/logs/${input.id}/json/`;

	let result = `${PREFIX}/logs/${input.id}/json`;

	if (input.page) result += `/?page=${input.page}`;

	return result;
};

const fetchJson = async (externalUrl: string) => {
	const getBublikFromStatusCode = (response: Response): BublikHttpError => {
		return { status: response.status };
	};

	const options: RequestInit = { credentials: 'include', cache: 'no-store' };

	const response = await fetch(externalUrl, options);

	if (!response.ok) throw getBublikFromStatusCode(response);

	return response.json();
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
		getLogArtifacts: build.query<ArtifactsJsonResponse, number>({
			queryFn: async (id, _api, _extraOptions, baseQuery) => {
				try {
					const getUrl = constructJsonUrl({ id });

					const jsonUrl = (await baseQuery(
						getUrl
					)) as QueryReturnValue<LogUrlResponse>;

					if (jsonUrl.error) {
						return {
							error: {
								status: 400,
								title: 'Something went wrong',
								description:
									'We are not sure what exactly went wrong, please report'
							}
						};
					}

					if (!jsonUrl.data) {
						return {
							error: {
								status: 404,
								title: 'No data',
								description: 'No json data found in response'
							}
						};
					}

					const artifactsJson = await fetchJson(jsonUrl.data.artifacts_url);

					return {
						data: {
							artifact_base_url: getArtifactBaseUrl(jsonUrl.data.artifacts_url),
							data: artifactsJson
						}
					};
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
		}),
		getLogJson: build.query<RootBlock, GetLogJsonInputs>({
			queryFn: async ({ page, id }, _api, _extraOptions, baseQuery) => {
				const getUrl = constructJsonUrl({ page, id });

				const jsonUrl = (await baseQuery(
					getUrl
				)) as QueryReturnValue<LogUrlResponse>;

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
					const [blocksJson, artifactsAndVerdicts] = (await Promise.all([
						fetchJson(jsonUrl.data.url),
						baseQuery(withApiV2(`/results/${id}/artifacts_and_verdicts`))
					])) as [RootBlock, QueryReturnValue<ResultsAndVerdictsForIteration>];

					const blocksWithAddedVerdictsAndArtifacts = addArtifactsVerdicts(
						blocksJson,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						artifactsAndVerdicts.data!
					);

					return {
						data: blocksWithAddedVerdictsAndArtifacts
					};
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

function addArtifactsVerdicts(
	logBlocks: RootBlock,
	artifactsAndVerdicts: ResultsAndVerdictsForIteration
): RootBlock {
	return createNextState(logBlocks, (s) => {
		const teLog = s.root.find((b) => b.type === 'te-log');
		if (!teLog) return;

		const logMeta = teLog.content.find((b) => b.type === 'te-log-meta');
		if (!logMeta) return;

		if (artifactsAndVerdicts.verdicts.length) {
			logMeta.meta.verdicts = artifactsAndVerdicts.verdicts.map((v) => ({
				level: 'RING', // default to this level since level is not provided by API
				verdict: v.value
			}));
		}

		if (artifactsAndVerdicts.artifacts.length) {
			logMeta.meta.artifacts = artifactsAndVerdicts.artifacts.map((v) => ({
				level: 'RING', // default to this level since level is not provided by API
				artifact: v.value
			}));
		}
	});
}
