/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
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

const RawLogAttachment = z.object({
	type: z.literal('text').describe('type of attachment'),
	view_type: z
		.literal('inline')
		.describe('inline means open in new browser tab'),
	name: z.string().describe('name of attachment'),
	description: z
		.string()
		.optional()
		.describe('optional description of attachment'),
	download_enabled: z
		.boolean()
		.optional()
		.default(false)
		.describe('should show button to download attachment'),
	path: z
		.string()
		.optional()
		.describe('path of attachment relative to attachments.json'),
	uri: z
		.string()
		.optional()
		.describe(
			'uri of attachment, if it is not relative to attachments.json or external'
		)
});

const LogAttachments = z.discriminatedUnion('type', [RawLogAttachment]);

export type LogAttachmentType = z.infer<typeof LogAttachments>['type'];

export type GetLogAttachmentByType<T extends LogAttachmentType> = z.infer<
	typeof LogAttachments
> extends { type: T }
	? z.infer<typeof LogAttachments>
	: never;

const AttachmentsSchema = z
	.object({
		version: z.number().describe('version of attachments.json'),
		attachments: z.array(LogAttachments).describe('list of attachments')
	})
	.describe('attachments.json schema');

type AttachmentsJsonResponse = {
	attachments_base_url: string;
	data: z.infer<typeof AttachmentsSchema>;
};

function getAttachmentsBaseUrl(attachmentsUrl: string): string {
	try {
		const url = new URL(attachmentsUrl);

		if (url.pathname.includes('/proxy/')) {
			const originalUrl = new URL(url.searchParams.get('url') || '');
			return originalUrl.href.replace(/\/attachments\.json$/, '');
		}

		return attachmentsUrl.replace(/\/attachments\.json$/, '');
	} catch (e) {
		return attachmentsUrl;
	}
}

type LogUrlResponse = {
	url: string;
	attachments_url: string;
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
		getLogAttachments: build.query<AttachmentsJsonResponse, number>({
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

					const attachmentsJson = await fetchJson(jsonUrl.data.attachments_url);

					return {
						data: {
							attachments_base_url: getAttachmentsBaseUrl(
								jsonUrl.data.attachments_url
							),
							data: attachmentsJson
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
