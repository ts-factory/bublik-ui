/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import type { BaseQueryApi } from '@reduxjs/toolkit/query/react';

import {
	createBaseQueryWithAuth,
	isRefreshExempt,
	REFRESH_URL
} from './base-query-with-auth';

const api = {
	signal: new AbortController().signal,
	abort: vi.fn(),
	dispatch: vi.fn(),
	getState: vi.fn(),
	extra: undefined,
	endpoint: 'test',
	type: 'query'
} as unknown as BaseQueryApi;

const forbidden = { error: { status: 403, data: 'Not Authenticated' } };
const ok = (data: unknown) => ({ data });

type Args = { url: string; method?: string };

const refreshCalls = (mock: { mock: { calls: unknown[][] } }) =>
	mock.mock.calls.filter(([args]) => (args as Args).url === REFRESH_URL);

describe('createBaseQueryWithAuth', () => {
	it('shares one refresh across concurrent 403s and retries each request', async () => {
		let refreshed = false;
		const baseQuery = vi.fn(async (args: Args) => {
			if (args.url === REFRESH_URL) {
				refreshed = true;
				return ok({ message: 'ok' });
			}

			return refreshed ? ok(args.url) : forbidden;
		});
		const query = createBaseQueryWithAuth({ baseQuery: baseQuery as never });

		const results = await Promise.all(
			['/a', '/b', '/api/v2/auth/profile/info/'].map((url) =>
				query({ url }, api, {})
			)
		);

		expect(results.map((r) => r.data)).toEqual([
			'/a',
			'/b',
			'/api/v2/auth/profile/info/'
		]);
		expect(refreshCalls(baseQuery)).toHaveLength(1);
	});

	it('does not abort the shared refresh when the first caller aborts', async () => {
		const baseQuery = vi.fn(async (args: Args, callApi: BaseQueryApi) => {
			if (args.url === REFRESH_URL) {
				expect(callApi.signal).not.toBe(api.signal);
				return ok({ message: 'ok' });
			}

			return refreshCalls(baseQuery).length ? ok(args.url) : forbidden;
		});
		const query = createBaseQueryWithAuth({ baseQuery: baseQuery as never });

		const result = await query({ url: '/a' }, api, {});

		expect(result.data).toBe('/a');
	});

	it('retries once after a failed refresh and reports failure if still rejected', async () => {
		const baseQuery = vi.fn(async () => forbidden);
		const onRefreshFailed = vi.fn();
		const query = createBaseQueryWithAuth({
			baseQuery: baseQuery as never,
			onRefreshFailed
		});

		const result = await query({ url: '/a' }, api, {});

		expect(result).toBe(forbidden);
		expect(onRefreshFailed).toHaveBeenCalledTimes(1);
		expect(onRefreshFailed).toHaveBeenCalledWith(api);
		// original + refresh + single retry, never a loop
		expect(baseQuery).toHaveBeenCalledTimes(3);
		expect(refreshCalls(baseQuery)).toHaveLength(1);
	});

	it('keeps the session when another tab refreshed the cookie meanwhile', async () => {
		let calls = 0;
		const baseQuery = vi.fn(async (args: Args) => {
			if (args.url === REFRESH_URL) return forbidden; // our token was already consumed
			calls += 1;
			return calls === 1 ? forbidden : ok(args.url);
		});
		const onRefreshFailed = vi.fn();
		const query = createBaseQueryWithAuth({
			baseQuery: baseQuery as never,
			onRefreshFailed
		});

		const result = await query({ url: '/a' }, api, {});

		expect(result.data).toBe('/a');
		expect(onRefreshFailed).not.toHaveBeenCalled();
	});

	it('returns non-auth errors and successes untouched', async () => {
		const serverError = { error: { status: 500, data: 'boom' } };
		const baseQuery = vi.fn(async (args: Args) =>
			args.url === '/ok' ? ok('fine') : serverError
		);
		const query = createBaseQueryWithAuth({ baseQuery: baseQuery as never });

		expect(await query({ url: '/ok' }, api, {})).toEqual(ok('fine'));
		expect(await query({ url: '/fail' }, api, {})).toBe(serverError);
		expect(refreshCalls(baseQuery)).toHaveLength(0);
	});

	it('never refreshes for unauthenticated auth flows', async () => {
		const baseQuery = vi.fn(async () => forbidden);
		const onRefreshFailed = vi.fn();
		const query = createBaseQueryWithAuth({
			baseQuery: baseQuery as never,
			onRefreshFailed
		});

		const result = await query(
			{ url: '/auth/login/', method: 'POST' },
			api,
			{}
		);

		expect(result).toBe(forbidden);
		expect(baseQuery).toHaveBeenCalledTimes(1);
		expect(onRefreshFailed).not.toHaveBeenCalled();
	});
});

describe('isRefreshExempt', () => {
	it.each([
		'/auth/login/',
		'/auth/refresh/',
		'/auth/logout/',
		'/auth/register/',
		'/auth/register/activate/1/tok/',
		'/auth/forgot_password/',
		'/auth/forgot_password/password_reset/1/tok/?x=1'
	])('exempts %s', (url) => {
		expect(isRefreshExempt(url)).toBe(true);
		expect(isRefreshExempt({ url })).toBe(true);
	});

	it.each([
		'/api/v2/auth/profile/info/',
		'/api/v2/auth/profile/password_reset/',
		'/api/v2/auth/profile/update_info/',
		'/api/v2/runs/?page=1',
		'/dashboard/'
	])('does not exempt %s', (url) => {
		expect(isRefreshExempt(url)).toBe(false);
		expect(isRefreshExempt({ url })).toBe(false);
	});
});
