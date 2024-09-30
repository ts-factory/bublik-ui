/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	BaseQueryFn,
	createApi,
	FetchArgs,
	fetchBaseQuery,
	FetchBaseQueryError,
	FetchBaseQueryMeta
} from '@reduxjs/toolkit/query/react';
import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';

import { config } from '@/bublik/config';

import { tagTypes } from './tags';
import { BUBLIK_API_REDUCER_PATH } from './constants';
import { getAPIConfig } from './config';
import { getMinutes } from './utils';
import {
	adminUsersEndpoints,
	authEndpoints,
	authUrls,
	dashboardEndpoints,
	deployEndpoints,
	historyEndpoints,
	importLogEventsEndpoint,
	logEndpoints,
	measurementsEndpoints,
	runEndpoints,
	runsEndpoints,
	reportEndpoints,
	configsEndpoints
} from './endpoints';

const baseQuery = fetchBaseQuery(getAPIConfig());

const baseQueryWithAuth: BaseQueryFn<
	string | FetchArgs,
	unknown,
	FetchBaseQueryError
> = async (args, api, extraOptions) => {
	const isAuthErrorRequest = (
		result: QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>
	) => {
		const AUTH_ERROR_CODE = 403; // 500

		return result.error && result.error.status === AUTH_ERROR_CODE;
	};

	const isIgnoreAuthUrl = (args: string | FetchArgs) => {
		const authUrlsValues = Object.values(authUrls).map((v) => v.url);

		return typeof args === 'string'
			? authUrlsValues.some((endpointUrl) => args.includes(endpointUrl))
			: authUrlsValues.some((endpointUrl) => args.url.includes(endpointUrl));
	};

	let result = await baseQuery(args, api, extraOptions);

	if (isIgnoreAuthUrl(args)) return result;

	if (isAuthErrorRequest(result)) {
		// 1. Try to get a new token
		const refreshResult = await baseQuery(
			{ url: '/auth/refresh/', method: 'POST' },
			api,
			extraOptions
		);

		// 2. If failed to refresh redirect to login page with redirect_url query param to return back on re-auth
		if (!refreshResult.data) {
			const loginUrl = new URL(
				`${window.location.origin}${config.baseUrl}/auth/login`
			);

			loginUrl.searchParams.set('redirect_url', window.location.href);

			window.location.replace(loginUrl);
		}

		// 3. Retry the initial query
		result = await baseQuery(args, api, extraOptions);
	}

	return result;
};

export const bublikAPI = createApi({
	reducerPath: BUBLIK_API_REDUCER_PATH,
	baseQuery: baseQueryWithAuth,
	tagTypes,
	keepUnusedDataFor: getMinutes(15),
	endpoints: (builder) => ({
		getShortUrl: builder.query<{ short_url: string }, { url: string }>({
			query: ({ url }) => `/url_shortner/?url=${encodeURIComponent(url)}`
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
	.injectEndpoints(configsEndpoints);

export const {
	// Dashboard
	useGetDashboardByDateQuery,
	useGetRunFallingFreqQuery,
	useLazyGetDashboardModeQuery,
	useGetDashboardModeQuery,
	// Version
	useGetDeployInfoQuery,
	// Run
	useGetRunDetailsQuery,
	useLazyGetRunDetailsQuery,
	useGetRunTableByRunIdQuery,
	useGetResultsTableQuery,
	useGetRunSourceQuery,
	useGetCompromisedTagsQuery,
	useDeleteCompromisedStatusMutation,
	useMarkAsCompromisedMutation,
	// History
	useGetHistoryLinearQuery,
	useGetHistoryAggregationQuery,
	// Runs
	useGetRunsTablePageQuery,
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
	useGetHistoryLinkDefaultsQuery,
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
	useLazyGetShortUrlQuery
} = bublikAPI;
