/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { tagTypes } from './tags';
import { BUBLIK_API_REDUCER_PATH } from './constants';
import { getAPIConfig } from './config';
import { getMinutes } from './utils';
import { createBaseQueryWithAuth } from './base-query-with-auth';
import { requestLogin } from './login-prompt';
import {
	accessTokenEndpoints,
	mcpServerEndpoints,
	adminUsersEndpoints,
	authEndpoints,
	dashboardEndpoints,
	deployEndpoints,
	historyEndpoints,
	importLogEventsEndpoint,
	logEndpoints,
	measurementsEndpoints,
	runEndpoints,
	runsEndpoints,
	reportEndpoints,
	configsEndpoints,
	projectEndpoints,
	analyticsEndpoints,
	chatEndpoints
} from './endpoints';

const baseQueryWithAuth = createBaseQueryWithAuth({
	baseQuery: fetchBaseQuery(getAPIConfig()),
	// A rejected query means the page can't render; a mutation is a single action
	onAuthRequired: (api) =>
		requestLogin({ kind: api.type === 'query' ? 'page' : 'action' })
});

export const bublikAPI = createApi({
	reducerPath: BUBLIK_API_REDUCER_PATH,
	baseQuery: baseQueryWithAuth,
	tagTypes,
	keepUnusedDataFor: getMinutes(15),
	endpoints: (builder) => ({
		getShortUrl: builder.query<{ short_url: string }, { url: string }>({
			query: ({ url }) => `/url_shortener/?url=${encodeURIComponent(url)}`
		})
	})
})
	.injectEndpoints(dashboardEndpoints)
	.injectEndpoints(deployEndpoints)
	.injectEndpoints(historyEndpoints)
	.injectEndpoints(logEndpoints)
	.injectEndpoints(runEndpoints)
	.injectEndpoints(runsEndpoints)
	.injectEndpoints(measurementsEndpoints)
	.injectEndpoints(importLogEventsEndpoint)
	.injectEndpoints(authEndpoints)
	.injectEndpoints(adminUsersEndpoints)
	.injectEndpoints(accessTokenEndpoints)
	.injectEndpoints(mcpServerEndpoints)
	.injectEndpoints(reportEndpoints)
	.injectEndpoints(configsEndpoints)
	.injectEndpoints(projectEndpoints)
	.injectEndpoints(analyticsEndpoints)
	.injectEndpoints(chatEndpoints);

export const {
	// Dashboard
	useGetDashboardByDateQuery,
	useGetRunFallingFreqQuery,
	useLazyGetDashboardModeQuery,
	useGetDashboardModeQuery,
	// Run
	useGetRunDetailsQuery,
	useLazyGetRunDetailsQuery,
	useGetRunTableByRunIdQuery,
	useGetMultipleRunsByRunIdsQuery,
	useGetRunsStatsByRunIdsQuery,
	useLazyGetRunsStatsByRunIdsQuery,
	useGetResultsTableQuery,
	useGetRunSourceQuery,
	useGetRunRequirementsQuery,
	useGetCompromisedTagsQuery,
	useDeleteCompromisedStatusMutation,
	useMarkAsCompromisedMutation,
	// History
	useGetHistoryLinearQuery,
	useGetHistoryAggregationQuery,
	useGetTestSearchOptionsQuery,
	// Runs
	useGetRunsTablePageQuery,
	useGetRunsProgressInfiniteQuery,
	useGetRunsChartsQuery,
	useGetResultInfoQuery,
	// Measurements
	useGetMeasurementsQuery,
	useGetSingleMeasurementQuery,
	// Import
	useGetImportEventLogQuery,
	useImportRunsMutation,
	useGetImportLogQuery,
	// Log
	useGetLogJsonQuery,
	useGetTreeByRunIdQuery,
	useGetLogUrlByResultIdQuery,
	useGetResultsAndVerdictsForIterationQuery,
	// Auth
	useMeQuery,
	useLazyMeQuery,
	useLoginMutation,
	useLogoutMutation,
	useRefreshMutation,
	useResetPasswordMutation,
	useRequestResetPasswordMutation,
	useChangePasswordMutation,
	useActivateEmailMutation,
	useUpdateProfileInfoMutation,
	// Admin
	useAdminGetUsersQuery,
	useAdminCreateUserMutation,
	useAdminDeleteUserMutation,
	useAdminUpdateUserMutation,
	// Access tokens
	useGetAccessTokensQuery,
	useCreateAccessTokenMutation,
	useRevokeAccessTokenMutation,
	useAdminGetAccessTokensQuery,
	// MCP servers
	useGetMcpServersQuery,
	useCreateMcpServerMutation,
	useUpdateMcpServerMutation,
	useDeleteMcpServerMutation,
	useGetMcpStatusQuery,
	useGetPerformanceTimeoutsQuery,
	useGetRunReportQuery,
	useGetRunReportConfigsQuery,
	useCreateTestCommentMutation,
	useEditTestCommentMutation,
	useDeleteTestCommentMutation,
	// Utils
	usePrefetch,
	useLazyGetShortUrlQuery,
	useGetServerFeaturesQuery,
	useGetAnalyticsOverviewQuery,
	useGetAnalyticsEventsQuery,
	useGetAnalyticsFacetsQuery,
	useGetAnalyticsChartsQuery,
	useLazyGetAnalyticsExportQuery,
	useImportAnalyticsDataMutation,
	useGetChatModelsQuery,
	useGetChatThreadQuery,
	useGetChatThreadsQuery,
	useRenameChatThreadMutation,
	useSetChatThreadArchivedMutation,
	useDeleteChatThreadMutation,
	useCancelChatRunMutation
} = bublikAPI;
