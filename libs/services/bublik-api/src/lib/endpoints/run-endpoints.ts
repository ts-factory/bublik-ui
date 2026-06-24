/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { groupBy } from 'remeda';
import { EndpointBuilder, QueryReturnValue } from '@reduxjs/toolkit/query';

import {
	RunSourceAPIRResponse,
	RunData,
	RunDataResults,
	ResultTableAPIQueryWithFilter,
	ResultDetailsAPIResponse,
	CompromisedTagsResponse,
	RunDetailsAPIResponse,
	CompromisedDeleteResponse,
	CompromisedPostResponse,
	CompromisedBody,
	CreateTestCommentResponse,
	CreateTestCommentParams,
	EditTestCommentParams,
	DeleteTestCommentParams,
	RunAPIResponse,
	RunAPIResponseSchema,
	RunTableAPIResponse,
	MergedRunTableAPIResponse,
	MergedRun,
	RunStats,
	RunSourceAPIRResponseSchema,
	ResultDetailsAPIResponseSchema
} from '@/shared/types';
import { config } from '@/bublik/config';

import { BUBLIK_TAG } from '../types';
import { getMinutes, prepareForSend } from '../utils';
import { transformRunTable } from '../transform';
import { API_REDUCER_PATH } from '../constants';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { z } from 'zod';

export interface ResultsAndVerdictsForIteration {
	artifacts: Artifact[];
	verdicts: Verdict[];
}

export interface Artifact {
	id: number;
	name: string;
	type: string;
	value: string;
	hash: string;
	comment: string;
}

export interface Verdict {
	id: number;
	name: string;
	type: string;
	value: string;
	hash: string;
	comment: string;
}

export function buildResultsTableParams({
	selector,
	testName,
	results,
	resultProperties
}: {
	selector: ResultTableAPIQueryWithFilter['selectors'][number];
	testName: string;
	results: string;
	resultProperties: string;
}): Record<string, string | number> {
	const params: Record<string, string | number> = {
		parent_id: selector.parentId,
		test_name: testName,
		start_exec_seqno: selector.startExecSeqno
	};

	if (results) params.results = results;
	if (resultProperties) params.result_properties = resultProperties;

	return params;
}

/**
 * Merges runs based on test_id and exec_seqno
 * @param runs - Top most packages of runs that contain children
 * @returns Array of merged runs with **ONE** root node where stats are merged
 */
export function mergeRuns(runs: Array<[number, RunData]>): Array<MergedRun> {
	// TODO: Add some checks so we compare only runs with same top package?
	const roots = runs.map(([_runId, node]) => node);
	const mergedNodes = createMergedNode(roots);

	return [mergedNodes];

	function createMergedNode(nodes: RunData[]): MergedRun {
		const mergedNode: MergedRun = {
			...nodes[0],
			result_ids: [],
			parent_ids: [],
			result_selectors: [],
			children: []
		};

		const parentIds = nodes
			.map((node) => node.parent_id)
			.filter((id): id is number => id !== null);

		mergedNode.result_ids = mergeIds(nodes.map((node) => node.result_id));
		mergedNode.parent_ids = mergeIds(parentIds);
		mergedNode.result_selectors = nodes.map((node) => ({
			parentId: node.parent_id ?? node.result_id,
			startExecSeqno: node.exec_seqno
		}));
		mergedNode.stats = mergeStats(nodes.map((node) => node.stats));

		const allChildren = nodes.map((node) => node.children).flat();
		const groupedChildrenById = groupBy(
			allChildren,
			(child) => `${child.test_id}:${child.exec_seqno}`
		);

		Object.entries(groupedChildrenById).forEach(([_, children]) => {
			mergedNode.children.push(createMergedNode(children));
		});

		return mergedNode;

		function mergeIds(ids: number[]): number[] {
			return [...new Set(ids)];
		}

		function mergeStats(stats: RunStats[]): RunStats {
			const DEFAULT_STATS = {
				abnormal: 0,
				failed: 0,
				passed: 0,
				skipped: 0,
				failed_unexpected: 0,
				passed_unexpected: 0,
				skipped_unexpected: 0
			};

			return stats.reduce<RunStats>(
				(acc, curr) => ({
					abnormal: acc.abnormal + curr.abnormal,
					failed: acc.failed + curr.failed,
					passed: acc.passed + curr.passed,
					skipped: acc.skipped + curr.skipped,
					failed_unexpected: acc.failed_unexpected + curr.failed_unexpected,
					passed_unexpected: acc.passed_unexpected + curr.passed_unexpected,
					skipped_unexpected: acc.skipped_unexpected + curr.skipped_unexpected
				}),
				DEFAULT_STATS
			);
		}
	}
}

const RunStatsParamsSchema = z.object({
	runId: z.string().or(z.number()),
	requirements: z.array(z.string()).optional()
});

type RunStatsParams = z.infer<typeof RunStatsParamsSchema>;

export type RunsStatsByRunIdResponse = {
	runs: Array<{ runId: number; results: RunData[]; defaultColumns?: unknown }>;
};

export const runEndpoints = {
	endpoints: (
		build: EndpointBuilder<
			BublikBaseQueryFn,
			BUBLIK_TAG | string,
			API_REDUCER_PATH
		>
	) => ({
		getRunSource: build.query<RunSourceAPIRResponse, string>({
			query: (runId) => ({ url: withApiV2(`/runs/${runId}/source`) }),
			argSchema: z.string(),
			responseSchema: RunSourceAPIRResponseSchema,
			keepUnusedDataFor: getMinutes(15)
		}),
		getRunTableByRunId: build.query<RunTableAPIResponse, RunStatsParams>({
			query: ({ runId, requirements }) => {
				const queryRequirements = requirements?.join(config.queryDelimiter);

				return {
					url: withApiV2(`/runs/${runId}/stats`),
					params: { requirements: queryRequirements },
					cache: 'no-cache'
				};
			},
			keepUnusedDataFor: getMinutes(5),
			argSchema: RunStatsParamsSchema,
			rawResponseSchema: RunAPIResponseSchema,
			transformResponse: transformRunTable,
			providesTags: [{ type: BUBLIK_TAG.Run }]
		}),
		getResultsTable: build.query<
			RunDataResults[],
			ResultTableAPIQueryWithFilter
		>({
			async queryFn(query, _queryApi, _extraOptions, fetchWithBQ) {
				try {
					const testName = query.testName;

					const requests = query.selectors.flatMap((selector) =>
						Object.entries(query.requests).map(([_columnId, props]) => {
							const results = props.results.join(config.queryDelimiter);
							const resultProperties = props.resultProperties.join(
								config.queryDelimiter
							);
							const params = buildResultsTableParams({
								selector,
								testName,
								results,
								resultProperties
							});

							return fetchWithBQ({
								url: withApiV2('/results'),
								params
							});
						})
					);

					const requestsResults = (await Promise.all(
						requests
					)) as QueryReturnValue<ResultDetailsAPIResponse>[];

					const parsedRequestsResults = requestsResults.map((result) =>
						result.data
							? ResultDetailsAPIResponseSchema.parse(result.data)
							: null
					);

					const checkedIds = new Set<number>();
					const data = parsedRequestsResults
						.map((result) => result?.results || [])
						.reduce((acc, curr) => [...acc, ...curr], [])
						.filter((item) => {
							const isDuplicate = checkedIds.has(item.result_id);
							checkedIds.add(item.result_id);
							return !isDuplicate;
						})
						.sort((a, b) => a.iteration_id - b.iteration_id);

					return { data };
				} catch (error) {
					return {
						error: {
							originalStatus: 500,
							error: 'Something went wrong',
							status: 'CUSTOM_ERROR'
						}
					};
				}
			}
		}),
		getCompromisedTags: build.query<
			CompromisedTagsResponse,
			{ projects?: number[] }
		>({
			query: (query) => ({
				url: withApiV2('/outside_domains/issues'),
				cache: 'no-cache',
				params: { project: query.projects?.[0] }
			})
		}),
		getRunRequirements: build.query<string[], string[] | number[]>({
			queryFn: async (runId, _api, _extraOptions, fetchWithBQ) => {
				const results = (await Promise.all(
					runId.map((id) => fetchWithBQ(withApiV2(`/runs/${id}/requirements`)))
				)) as QueryReturnValue<{ requirements: string[] }, unknown>[];

				return {
					data: Array.from(
						new Set(
							results.flatMap((result) => result.data?.requirements ?? [])
						)
					)
				};
			}
		}),
		getRunDetails: build.query<RunDetailsAPIResponse, string | number>({
			query: (runId) => ({
				url: withApiV2(`/runs/${runId}/details`),
				cache: 'reload'
			}),
			argSchema: z.string().or(z.number()),
			providesTags: (_result, _error, runId) => [
				{ type: BUBLIK_TAG.RunDetails, id: runId }
			]
		}),
		deleteCompromisedStatus: build.mutation<
			CompromisedDeleteResponse,
			string | number
		>({
			query: (runId) => ({
				url: withApiV2(`/runs/${runId}/compromised`),
				method: 'DELETE'
			}),
			invalidatesTags: (_result, _error, runId) => [
				{ type: BUBLIK_TAG.RunDetails, id: runId },
				BUBLIK_TAG.Run,
				BUBLIK_TAG.DashboardData
			]
		}),
		markAsCompromised: build.mutation<CompromisedPostResponse, CompromisedBody>(
			{
				query: (body: CompromisedBody) => ({
					url: withApiV2(`/runs/${body.runId}/compromised`),
					method: 'POST',
					body: prepareForSend(body)
				}),
				invalidatesTags: (_result, _error, { runId }) => [
					{ type: BUBLIK_TAG.RunDetails, id: runId },
					BUBLIK_TAG.Run,
					BUBLIK_TAG.DashboardData
				]
			}
		),
		createTestComment: build.mutation<
			CreateTestCommentResponse,
			CreateTestCommentParams
		>({
			query: (params) => ({
				url: withApiV2(`/tests/${params.testId}/comments`),
				method: 'POST',
				params: { project: params.projectId },
				body: { comment: params.comment }
			}),
			invalidatesTags: [BUBLIK_TAG.Run]
		}),
		editTestComment: build.mutation<
			CreateTestCommentResponse,
			EditTestCommentParams
		>({
			query: (params) => ({
				url: withApiV2(`/tests/${params.testId}/comments/${params.commentId}`),
				method: 'PATCH',
				params: { project: params.projectId },
				body: { comment: params.comment }
			}),
			invalidatesTags: [BUBLIK_TAG.Run]
		}),
		deleteTestComment: build.mutation<
			CreateTestCommentResponse,
			DeleteTestCommentParams
		>({
			query: (params) => ({
				url: withApiV2(`/tests/${params.testId}/comments/${params.commentId}`),
				params: { project: params.projectId },
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Run]
		}),
		getMultipleRunsByRunIds: build.query<
			MergedRunTableAPIResponse,
			RunStatsParams[]
		>({
			queryFn: async (params, _api, _extraOptions, fetchWithBQ) => {
				try {
					const queryParams = params.map(({ runId, requirements }) => {
						const queryRequirements = requirements?.join(config.queryDelimiter);
						const params = {} as Record<string, string>;
						if (queryRequirements) params.requirements = queryRequirements;

						return { url: withApiV2(`/runs/${runId}/stats`), params };
					});

					const requests = queryParams.map((queryParam) =>
						fetchWithBQ(queryParam)
					);

					const requestsResults = await Promise.all(
						params.map(async (runId, index) => {
							const result = (await requests[
								index
							]) as QueryReturnValue<RunAPIResponse>;
							const parsed = result.data
								? RunAPIResponseSchema.parse(result.data)
								: null;
							const data = parsed?.results;

							return data
								? {
										entry: [Number(runId.runId), data] as [number, RunData],
										defaultColumns: parsed.default_columns
								  }
								: null;
						})
					);

					const filteredResults = requestsResults.filter(
						(item): item is NonNullable<(typeof requestsResults)[number]> =>
							item !== null
					);

					if (!filteredResults.length) {
						return { data: { results: [] } };
					}

					return {
						data: {
							results: mergeRuns(filteredResults.map((item) => item.entry)),
							defaultColumns: filteredResults[0]?.defaultColumns
						}
					};
				} catch (error) {
					return {
						error: {
							originalStatus: 500,
							error:
								error instanceof Error
									? error.message
									: 'Invalid run stats response',
							status: 'CUSTOM_ERROR'
						}
					};
				}
			},
			argSchema: z.array(RunStatsParamsSchema),
			providesTags: [BUBLIK_TAG.Run]
		}),
		getRunsStatsByRunIds: build.query<
			RunsStatsByRunIdResponse,
			RunStatsParams[]
		>({
			queryFn: async (params, _api, _extraOptions, fetchWithBQ) => {
				try {
					const requestsResults = await Promise.all(
						params.map(async ({ runId, requirements }) => {
							const queryRequirements = requirements?.join(
								config.queryDelimiter
							);
							const queryParams = {} as Record<string, string>;

							if (queryRequirements)
								queryParams.requirements = queryRequirements;

							const result = (await fetchWithBQ({
								url: withApiV2(`/runs/${runId}/stats`),
								params: queryParams
							})) as QueryReturnValue<RunAPIResponse>;

							const parsed = result.data
								? RunAPIResponseSchema.parse(result.data)
								: null;

							return parsed?.results
								? {
										runId: Number(runId),
										results: [parsed.results],
										defaultColumns: parsed.default_columns
								  }
								: null;
						})
					);

					return {
						data: {
							runs: requestsResults.filter(
								(item): item is NonNullable<(typeof requestsResults)[number]> =>
									item !== null
							)
						}
					};
				} catch (error) {
					return {
						error: {
							originalStatus: 500,
							error:
								error instanceof Error
									? error.message
									: 'Invalid run stats response',
							status: 'CUSTOM_ERROR'
						}
					};
				}
			},
			argSchema: z.array(RunStatsParamsSchema),
			providesTags: [BUBLIK_TAG.Run]
		}),
		getResultsAndVerdictsForIteration: build.query<
			ResultsAndVerdictsForIteration,
			string | number
		>({
			query: (iterationId) =>
				withApiV2(`/results/${iterationId}/artifacts_and_verdicts`)
		}),
		getRunComment: build.query({
			query: ({ runId }) => withApiV2(`/runs/${runId}/comment`),
			argSchema: z.object({ runId: z.number() }),
			responseSchema: z.object({ comment: z.string().nullable() }),
			providesTags: ['run-comment']
		}),
		deleteRunComment: build.mutation({
			query: ({ runId }) => ({
				url: withApiV2(`/runs/${runId}/comment`),
				method: 'DELETE'
			}),
			argSchema: z.object({ runId: z.number() }),
			invalidatesTags: ['run-comment']
		}),
		createRunComment: build.mutation({
			query: ({ runId, comment }) => ({
				url: withApiV2(`/runs/${runId}/comment`),
				method: 'POST',
				body: { comment }
			}),
			argSchema: z.object({
				runId: z.number(),
				comment: z.string()
			}),
			responseSchema: z.object({
				id: z.number(),
				comment: z.string()
			}),
			invalidatesTags: ['run-comment']
		}),
		updateRunComment: build.mutation({
			query: ({ runId, comment }) => ({
				url: withApiV2(`/runs/${runId}/comment`),
				method: 'PUT',
				body: { comment: comment }
			}),
			argSchema: z.object({
				runId: z.number(),
				comment: z.string()
			}),
			responseSchema: z.object({
				id: z.number(),
				comment: z.string()
			}),
			invalidatesTags: ['run-comment']
		})
	})
};
