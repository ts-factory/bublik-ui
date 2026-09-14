/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	BaseQueryApi,
	BaseQueryFn,
	FetchArgs,
	fetchBaseQuery,
	FetchBaseQueryError,
	FetchBaseQueryMeta,
	QueryReturnValue
} from '@reduxjs/toolkit/query/react';

/** The backend answers 403 for an expired access token. */
export const AUTH_ERROR_CODE = 403;

export const REFRESH_URL = '/auth/refresh/';

/**
 * Unauthenticated auth flows whose 403 must never trigger a token refresh.
 * Matched by pathname prefix so nested routes
 * (`/auth/register/activate/...`, `/auth/forgot_password/password_reset/...`) are covered too.
 * NOTE: `/api/v2/auth/profile/...` (the `me` query, password change) is intentionally
 * not here: those are authenticated calls and must refresh like any other request.
 */
export const REFRESH_EXEMPT_PREFIXES = [
	'/auth/login/',
	'/auth/refresh/',
	'/auth/logout/',
	'/auth/register/',
	'/auth/forgot_password/'
] as const;

type RawBaseQuery = ReturnType<typeof fetchBaseQuery>;
type RawResult = QueryReturnValue<
	unknown,
	FetchBaseQueryError,
	FetchBaseQueryMeta
>;

const getPathname = (args: string | FetchArgs) => {
	const url = typeof args === 'string' ? args : args.url;

	return url.split('?')[0];
};

export const isRefreshExempt = (args: string | FetchArgs) => {
	const pathname = getPathname(args);

	return REFRESH_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const isAuthError = (result: RawResult) =>
	Boolean(result.error && result.error.status === AUTH_ERROR_CODE);

export interface CreateBaseQueryWithAuthOptions {
	baseQuery: RawBaseQuery;
	/**
	 * Called once per request whose session could not be restored
	 * (refresh failed and the retried request is still rejected).
	 */
	onRefreshFailed?: (api: BaseQueryApi) => void;
}

/**
 * Wraps `fetchBaseQuery` with silent token refresh.
 *
 * - Concurrent 403s share ONE `POST /auth/refresh/`. The backend rotates and
 *   blacklists the refresh token on first use, so parallel refreshes with the
 *   same cookie would make every request but the first fail.
 * - After the shared refresh settles the original request is retried exactly
 *   once, even when the refresh failed: another tab may have rotated the cookie
 *   in the shared jar in the meantime.
 */
export function createBaseQueryWithAuth({
	baseQuery,
	onRefreshFailed
}: CreateBaseQueryWithAuthOptions): BaseQueryFn<
	string | FetchArgs,
	unknown,
	FetchBaseQueryError
> {
	let refreshInFlight: Promise<boolean> | null = null;

	const refreshTokens = (
		api: BaseQueryApi,
		extraOptions: Parameters<RawBaseQuery>[2]
	) => {
		if (!refreshInFlight) {
			// Detach from the caller's abort signal: if the component that started
			// the refresh unmounts, the other waiters must still get their tokens.
			const detachedApi: BaseQueryApi = {
				...api,
				signal: new AbortController().signal
			};

			refreshInFlight = Promise.resolve(
				baseQuery(
					{ url: REFRESH_URL, method: 'POST' },
					detachedApi,
					extraOptions
				)
			)
				.then((result) => !result.error)
				.catch(() => false)
				.finally(() => {
					refreshInFlight = null;
				});
		}

		return refreshInFlight;
	};

	return async (args, api, extraOptions) => {
		const result = await baseQuery(args, api, extraOptions);

		if (!isAuthError(result) || isRefreshExempt(args)) return result;

		const refreshed = await refreshTokens(api, extraOptions);
		const retried = await baseQuery(args, api, extraOptions);

		if (refreshed || !isAuthError(retried)) return retried;

		onRefreshFailed?.(api);

		return result;
	};
}
