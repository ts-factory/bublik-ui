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

/** Message the backend sends when there is no valid session at all. */
export const NOT_AUTHENTICATED_MESSAGE = 'Not Authenticated';

/**
 * Endpoints that are expected to be rejected for anonymous visitors and must
 * not ask them to log in (the `me` query runs on every page).
 */
export const LOGIN_PROMPT_EXEMPT_ENDPOINTS = ['me'] as const;

/**
 * Whether the error means "log in first", as opposed to a 403 for a logged-in
 * user who lacks permissions (`You are not authorized to perform this action`).
 */
export const isNotAuthenticatedError = (error: unknown): boolean => {
	if (typeof error !== 'object' || error === null) return false;

	const { status, data } = error as { status?: unknown; data?: unknown };

	if (status !== AUTH_ERROR_CODE) return false;
	if (data === NOT_AUTHENTICATED_MESSAGE) return true;
	if (typeof data !== 'object' || data === null) return false;

	const { messages } = data as { messages?: unknown };

	return Array.isArray(messages)
		? messages.includes(NOT_AUTHENTICATED_MESSAGE)
		: messages === NOT_AUTHENTICATED_MESSAGE;
};

const isLoginPromptExempt = (api: BaseQueryApi) =>
	(LOGIN_PROMPT_EXEMPT_ENDPOINTS as readonly string[]).includes(api.endpoint);

export interface CreateBaseQueryWithAuthOptions {
	baseQuery: RawBaseQuery;
	/**
	 * Called when a request is still rejected as "Not Authenticated" after the
	 * silent refresh. Resolve `true` once the user logged in to retry the
	 * request, `false` to hand the original error back to the caller.
	 */
	onAuthRequired?: (api: BaseQueryApi) => Promise<boolean>;
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
 * - If the session is still missing, `onAuthRequired` gets a chance to log the
 *   user in, after which the request is retried one last time.
 */
export function createBaseQueryWithAuth({
	baseQuery,
	onAuthRequired
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

		if (
			!onAuthRequired ||
			isLoginPromptExempt(api) ||
			!isNotAuthenticatedError(retried.error)
		) {
			return result;
		}

		const loggedIn = await onAuthRequired(api);

		return loggedIn ? baseQuery(args, api, extraOptions) : result;
	};
}
