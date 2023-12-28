/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResetPasswordForm } from './reset-password.component';

describe('ChangePasswordForm', () => {
	it('should match snapshot', async () => {
		const handleSubmit = vi.fn();

		const { asFragment } = render(
			<ResetPasswordForm onSubmit={handleSubmit} />
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should submit form with correct values', async () => {
		const handleSubmit = vi.fn();

		const { getByLabelText, getByRole } = render(
			<ResetPasswordForm onSubmit={handleSubmit} />
		);

		await userEvent.type(getByLabelText('Password'), 'Password123');
		await userEvent.type(getByLabelText('Confirm Password'), 'Password123');
		await userEvent.click(getByRole('button'));

		expect(handleSubmit).toHaveBeenCalled();
	});
});
