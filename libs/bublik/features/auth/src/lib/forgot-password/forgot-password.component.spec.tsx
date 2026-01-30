/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from './forgot-password.component';
describe('ForgotPasswordForm', () => {
	it('should match snapshot', async () => {
		const onSubmit = vi.fn();
		const { asFragment } = render(<ForgotPasswordForm onSubmit={onSubmit} />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should call onSubmit with the email when the form is submitted', async () => {
		const onSubmit = vi.fn();
		const { getByLabelText, getByRole } = render(
			<ForgotPasswordForm onSubmit={onSubmit} />
		);
		await userEvent.type(getByLabelText(/email/i), 'test@example.com');
		await userEvent.click(getByRole('button'));
		expect(onSubmit).toHaveBeenCalledWith({
			email: 'test@example.com'
		});
	});
	it('should dispaly error when email is not correct', async () => {
		const onSubmit = vi.fn();
		const { getByLabelText, asFragment, getByRole } = render(
			<ForgotPasswordForm onSubmit={onSubmit} />
		);
		await userEvent.type(getByLabelText(/email/i), 'testexample.com');
		await userEvent.click(getByRole('button'));
		expect(asFragment()).toMatchSnapshot();
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
