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
	MergedRun,
	RunStats
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

/**
 * Merges runs based on result_id and exec_seqno
 * @param runs - Top most packages of runs that contain children
 * @returns Array of merged runs with **ONE** root node where stats are merged
 */
function mergeRuns(runs: Array<[number, RunData]>): Array<MergedRun> {
	// TODO: Add some checks so we compare only runs with same top package?
	const runMap = new Map<number, RunData>(runs);

	const nodesMap = new Map<[number, number], Map<number, RunData>>();
	Array.from(runMap.entries()).forEach(([runId, node]) =>
		nodesMap.set([runId, node.result_id], createNodeMap(node))
	);

	const roots = Array.from(nodesMap.entries())
		.map(([[_, rootId], nodeMap]) => nodeMap.get(rootId))
		.filter((node): node is RunData => node !== undefined);

	const mergedNodes = createMergedNode(roots);

	return [mergedNodes];

	function createMergedNode(nodes: RunData[]): MergedRun {
		const mergedNode: MergedRun = {
			...nodes[0],
			result_ids: [],
			parent_ids: [],
			children: []
		};

		const parentIds = nodes
			.map((node) => node.parent_id)
			.filter((id): id is number => id !== null);

		mergedNode.result_ids = mergeIds(nodes.map((node) => node.result_id));
		mergedNode.parent_ids = mergeIds(parentIds);
		mergedNode.stats = mergeStats(nodes.map((node) => node.stats));

		const allChildren = nodes.map((node) => node.children).flat();
		const groupedChildrenById = groupBy(
			allChildren,
			(child) => child.result_id
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

	function createNodeMap(
		node: RunData,
		map: Map<number, RunData> = new Map()
	): Map<number, RunData> {
		map.set(node.result_id, node);

		node.children.forEach((child) => createNodeMap(child, map));

		return map;
	}
}

const RunStatsParamsSchema = z.object({
	runId: z.string().or(z.number()),
	requirements: z.array(z.string()).optional()
});

type RunStatsParams = z.infer<typeof RunStatsParamsSchema>;

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
			keepUnusedDataFor: getMinutes(15)
		}),
		getRunTableByRunId: build.query<RunData[] | null, RunStatsParams>({
			query: ({ runId, requirements }) => {
				const queryRequirements = requirements?.join(config.queryDelimiter);

				return {
					url: withApiV2(`/runs/${runId}/stats`),
					params: { requirements: queryRequirements },
					cache: 'no-cache'
				};
			},
			keepUnusedDataFor: getMinutes(5),
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
					const parentIds = Array.isArray(query.parentId)
						? query.parentId
						: [query.parentId];

					const requests = parentIds.flatMap((parentId) =>
						Object.entries(query.requests).map(([_columnId, props]) => {
							const results = props.results.join(config.queryDelimiter);
							const resultProperties = props.resultProperties.join(
								config.queryDelimiter
							);

							return fetchWithBQ(
								withApiV2(
									`/results/?parent_id=${parentId}&test_name=${testName}&results=${results}&result_properties=${resultProperties}`,
									true
								)
							);
						})
					);

					const requestsResults = (await Promise.all(
						requests
					)) as QueryReturnValue<ResultDetailsAPIResponse>[];

					const checkedIds = new Set<number>();
					const data = requestsResults
						.map((result) => result?.data?.results || [])
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
				url: withApiV2('/outside_domains/logs'),
				params: { project: query.projects?.[0] },
				cache: 'no-cache'
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
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Run]
		}),
		getMultipleRunsByRunIds: build.query<MergedRun[], RunStatsParams[]>({
			queryFn: async (params, _api, _extraOptions, fetchWithBQ) => {
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
						const data = result.data?.results;

						return data ? [Number(runId.runId), data] : null;
					})
				);

				const filteredResults = requestsResults.filter(
					(item): item is [number, RunData] => item !== null
				);

				return { data: mergeRuns(filteredResults) };
			},
			providesTags: [BUBLIK_TAG.Run]
		}),
		getResultsAndVerdictsForIteration: build.query<
			ResultsAndVerdictsForIteration,
			string | number
		>({
			query: (iterationId) =>
				withApiV2(`/results/${iterationId}/artifacts_and_verdicts`)
		})
	})
};
