/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, it, vi, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import { LoginForm } from './login-form.component';

describe('LoginForm', () => {
	it('should render without crashing', () => {
		const mockSubmit = vi.fn();

		render(<LoginForm onSubmit={mockSubmit} />, { wrapper: BrowserRouter });
	});

	it('should match snapshot', async () => {
		const mockSubmit = vi.fn();

		const { asFragment } = render(<LoginForm onSubmit={mockSubmit} />, {
			wrapper: BrowserRouter
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it('should call onSubmit when valid form is submitted', async () => {
		const mockSubmit = vi.fn();

		const { getByLabelText, getByRole } = render(
			<LoginForm
				onSubmit={mockSubmit}
				defaultValues={{ email: '', password: '' }}
			/>,
			{ wrapper: BrowserRouter }
		);

		await userEvent.type(getByLabelText(/email/i), 'test@example.com');
		await userEvent.type(getByLabelText(/password/i), 'password123');
		await userEvent.click(getByRole('button', { name: 'Sign in' }));

		expect(mockSubmit).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123'
		});
	});

	it('should not call onSubmit if email is not an email', async () => {
		const mockSubmit = vi.fn();

		const { getByLabelText, getByRole } = render(
			<LoginForm onSubmit={mockSubmit} />,
			{ wrapper: BrowserRouter }
		);

		await userEvent.type(getByLabelText(/email/i), 'testexample.com');
		await userEvent.type(getByLabelText(/password/i), 'short');
		await userEvent.click(getByRole('button', { name: 'Sign in' }));

		expect(mockSubmit).not.toHaveBeenCalled();
	});

	it('should not call onSubmit if email is invalid', async () => {
		const mockSubmit = vi.fn();

		const { getByLabelText, getByRole } = render(
			<LoginForm onSubmit={mockSubmit} />,
			{ wrapper: BrowserRouter }
		);

		await userEvent.type(getByLabelText(/email/i), 'invalidEmail');
		await userEvent.type(getByLabelText(/password/i), 'validPassword123');
		await userEvent.click(getByRole('button', { name: 'Sign in' }));

		expect(mockSubmit).not.toHaveBeenCalled();
	});
});
