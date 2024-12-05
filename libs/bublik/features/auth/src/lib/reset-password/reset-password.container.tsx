/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
	ResetPasswordParamsSchema,
	ResetUserPasswordFormInputs
} from '@/shared/types';
import { toast } from '@/shared/tailwind-ui';
import { useResetPasswordMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import {
	ResetPasswordForm,
	ResetPasswordFormHandle
} from './reset-password.component';

export const ResetPasswordFormContainer = () => {
	const navigate = useNavigate();
	const params = useParams();
	const [resetPassword] = useResetPasswordMutation();
	const formRef = useRef<ResetPasswordFormHandle>(null);

	const handleSubmit = async (form: ResetUserPasswordFormInputs) => {
		const formHandle = formRef.current;
		if (!formHandle) return;

		try {
			const parsedParams = ResetPasswordParamsSchema.parse(params);

			await resetPassword({ ...parsedParams, ...form }).unwrap();

			toast.success('Successfully reset password');
			navigate('/auth/login');
		} catch (error: unknown) {
			setErrorsOnForm(error, {
				handle: formHandle,
				onSetError: (_, error, handle) => {
					handle.setError('new_password', error);
					handle.setError('new_password_confirm', error);
				}
			});
			toast.error('Failed to reset password!');
		}
	};

	return <ResetPasswordForm onSubmit={handleSubmit} ref={formRef} />;
};
