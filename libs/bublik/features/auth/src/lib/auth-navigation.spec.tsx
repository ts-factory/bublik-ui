/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/bublik/config';
import { renderWithRouter } from '@/router/testing';
import { toast } from '@/shared/tailwind-ui';

import { ForgotPasswordFormContainer } from './forgot-password';
import { LoginForm } from './login-form/login-form.component';
import { ResetPasswordFormContainer } from './reset-password';

const mocks = vi.hoisted(() => ({
	requestResetPassword: vi.fn(),
	resetPassword: vi.fn()
}));

vi.mock('@/services/bublik-api', () => ({
	useRequestResetPasswordMutation: () => [mocks.requestResetPassword],
	useResetPasswordMutation: () => [mocks.resetPassword]
}));

const resolved = () => ({ unwrap: () => Promise.resolve() });

describe('auth page navigation', () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it('links the login form to password recovery', async () => {
		await renderWithRouter(<LoginForm />, { path: '/auth/login' });

		expect(
			screen
				.getByRole('link', { name: 'Forgot password?' })
				.getAttribute('href')
		).toBe(`${config.baseUrl}/auth/forgot`);
	});

	it('pushes the login page once the recovery email is sent', async () => {
		mocks.requestResetPassword.mockReturnValue(resolved());

		const { router } = await renderWithRouter(<ForgotPasswordFormContainer />, {
			path: '/auth/forgot'
		});

		await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
		await userEvent.click(screen.getByRole('button'));

		await waitFor(() =>
			expect(router.history.location.href).toBe(`${config.baseUrl}/auth/login`)
		);
		expect(mocks.requestResetPassword).toHaveBeenCalledWith({
			email: 'a@example.com'
		});
		expect(router.history.length).toBe(2);
	});

	it('validates the reset link params at submit, then pushes the login page', async () => {
		mocks.resetPassword.mockReturnValue(resolved());

		const { router } = await renderWithRouter(
			<ResetPasswordFormContainer
				params={{ userId: '42', resetToken: 'reset-token' }}
			/>,
			{ path: '/auth/forgot_password/password_reset/42/reset-token' }
		);

		await userEvent.type(screen.getByLabelText(/^password/i), 'secret');
		await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret');
		await userEvent.click(screen.getByRole('button'));

		await waitFor(() =>
			expect(router.history.location.href).toBe(`${config.baseUrl}/auth/login`)
		);
		expect(mocks.resetPassword).toHaveBeenCalledWith({
			userId: '42',
			resetToken: 'reset-token',
			new_password: 'secret',
			new_password_confirm: 'secret'
		});
		expect(router.history.length).toBe(2);
	});

	it('refuses a reset whose link params fail validation and stays put', async () => {
		const toastError = vi.spyOn(toast, 'error');
		const { router } = await renderWithRouter(
			<ResetPasswordFormContainer params={{ userId: '42' }} />,
			{ path: '/auth/forgot_password/password_reset/42/reset-token' }
		);

		await userEvent.type(screen.getByLabelText(/^password/i), 'secret');
		await userEvent.type(screen.getByLabelText(/confirm password/i), 'secret');
		await userEvent.click(screen.getByRole('button'));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith('Failed to reset password!')
		);
		expect(mocks.resetPassword).not.toHaveBeenCalled();
		expect(router.history.length).toBe(1);
	});
});
