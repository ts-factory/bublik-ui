/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { config } from '@/bublik/config';
import { renderHookWithRouter } from '@/router/testing';

import { useLoginRedirect } from './login-form.hooks';

const ORIGIN = 'https://bublik.example.invalid';

async function redirectFrom(redirectUrl: string | undefined) {
	const search = redirectUrl
		? new URLSearchParams({ redirect_url: redirectUrl }).toString()
		: '';
	const { result, router } = await renderHookWithRouter(
		() => useLoginRedirect(),
		{ path: '/auth/login', search }
	);

	act(() => result.current(redirectUrl));

	return router;
}

describe('useLoginRedirect', () => {
	afterEach(cleanup);

	it('pushes the exact pre-login URL with the base URL stripped', async () => {
		const router = await redirectFrom(
			`${ORIGIN}${config.baseUrl}/runs/1?mode=charts&project=2#top`
		);

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				`${config.baseUrl}/runs/1?mode=charts&project=2#top`
			)
		);
		expect(router.history.length).toBe(2);
	});

	it('returns to the base URL root when the redirect is the base URL itself', async () => {
		const router = await redirectFrom(`${ORIGIN}${config.baseUrl}`);

		await waitFor(() =>
			expect(router.history.location.href).toBe(`${config.baseUrl}/`)
		);
		expect(router.history.length).toBe(2);
	});

	it.each([undefined, ''])(
		'replaces the login page with the dashboard without a redirect (%j)',
		async (redirectUrl) => {
			const router = await redirectFrom(redirectUrl);

			await waitFor(() =>
				expect(router.history.location.href).toBe(`${config.baseUrl}/dashboard`)
			);
			expect(router.history.length).toBe(1);
		}
	);
});
