/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { config } from '@/bublik/config';

import { tagTypes } from './tags';
import { BUBLIK_API_REDUCER_PATH } from './constants';
import { getAPIConfig } from './config';
import { getMinutes } from './utils';
import { createBaseQueryWithAuth } from './base-query-with-auth';
import {
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

/**
 * Whether the store already holds a logged-in user. Anonymous visitors on
 * public pages also get a 403 from the `me` query and must not be sent to the
 * login page.
 */
function hasCachedUser(state: unknown): boolean {
	type MeState = Parameters<
		ReturnType<typeof bublikAPI.endpoints.me.select>
	>[0];

	return Boolean(bublikAPI.endpoints.me.select()(state as MeState).data);
}

const baseQueryWithAuth = createBaseQueryWithAuth({
	baseQuery: fetchBaseQuery(getAPIConfig()),
	onRefreshFailed: (api) => {
		if (!hasCachedUser(api.getState())) return;

		// Session is gone for real: go to the login page and come back here after re-auth.
		const loginUrl = new URL(
			`${window.location.origin}${config.baseUrl}/auth/login`
		);

		loginUrl.searchParams.set('redirect_url', window.location.href);

		window.location.replace(loginUrl);
	}
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
