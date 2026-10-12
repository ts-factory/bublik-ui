/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/bublik/config';

import { createAppRouter } from '../../router';
import { inertRouterContext } from '../../test/inert-router-context';

const mocks = vi.hoisted(() => ({
	verifyEmail: vi.fn(),
	trackEvent: vi.fn()
}));

// The pages under test are the app's: only the feature containers they hand
// the route's params and search to are replaced, by probes that show them.
vi.mock('@/bublik/features/auth', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/bublik/features/auth')>()),
	useAuth: () => ({ verifyEmail: mocks.verifyEmail }),
	LoginFormContainer: ({ redirectUrl }: { redirectUrl?: string }) => (
		<p data-testid="login-form">{JSON.stringify({ redirectUrl })}</p>
	),
	ResetPasswordFormContainer: ({ params }: { params: unknown }) => (
		<p data-testid="reset-form">{JSON.stringify(params)}</p>
	)
}));

vi.mock('@/bublik/features/analytics', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/bublik/features/analytics')>()),
	trackEvent: mocks.trackEvent
}));

async function renderAppAt(url: string) {
	const router = createAppRouter(
		createMemoryHistory({ initialEntries: [`${config.baseUrl}${url}`] }),
		inertRouterContext
	);

	await router.load();
	render(<RouterProvider router={router} />);

	return router;
}

describe('auth pages read the URL through their routes', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('hands the login form its typed redirect_url', async () => {
		const redirectUrl = `https://bublik.example.invalid${config.baseUrl}/runs?mode=charts`;

		await renderAppAt(
			`/auth/login?${new URLSearchParams({ redirect_url: redirectUrl })}`
		);

		expect(
			JSON.parse((await screen.findByTestId('login-form')).textContent ?? '')
		).toEqual({ redirectUrl });
	});

	it('hands the login form no redirect without one', async () => {
		await renderAppAt('/auth/login');

		expect(
			JSON.parse((await screen.findByTestId('login-form')).textContent ?? '')
		).toEqual({});
	});

	it('hands the reset form the user and the token of the reset link', async () => {
		await renderAppAt('/auth/forgot_password/password_reset/42/reset-token');

		expect(
			JSON.parse((await screen.findByTestId('reset-form')).textContent ?? '')
		).toEqual({ userId: '42', resetToken: 'reset-token' });
	});

	describe('the email activation link, trailing slash included', () => {
		const LINK = '/auth/register/activate/42/activation-token/';

		it('verifies the user and the token on mount, then pushes the login page', async () => {
			mocks.verifyEmail.mockReturnValue({ unwrap: () => Promise.resolve() });

			const router = await renderAppAt(LINK);

			await waitFor(() =>
				expect(router.history.location.href).toBe(
					`${config.baseUrl}/auth/login`
				)
			);
			expect(mocks.verifyEmail).toHaveBeenCalledTimes(1);
			expect(mocks.verifyEmail).toHaveBeenCalledWith({
				userId: '42',
				token: 'activation-token'
			});
			expect(router.history.length).toBe(2);
		});

		it('stays on the link, slash kept, when the token is refused', async () => {
			mocks.verifyEmail.mockReturnValue({
				unwrap: () => Promise.reject(new Error('stale'))
			});

			const router = await renderAppAt(LINK);

			await screen.findByText('Email verification in progress...');
			await waitFor(() =>
				expect(mocks.trackEvent).toHaveBeenCalledWith(expect.anything(), {
					status: 'error'
				})
			);
			expect(router.history.location.href).toBe(`${config.baseUrl}${LINK}`);
			expect(router.history.length).toBe(1);
		});
	});
});
