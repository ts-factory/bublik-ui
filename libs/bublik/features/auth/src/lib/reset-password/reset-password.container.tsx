/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';

import {
	ResetPasswordParamsInputs,
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

type ResetPasswordFormContainerProps = {
	/** The reset link's path params, validated when the form is submitted. */
	params: Partial<ResetPasswordParamsInputs>;
};

export const ResetPasswordFormContainer = ({
	params
}: ResetPasswordFormContainerProps) => {
	const navigate = useNavigate();
	const [resetPassword] = useResetPasswordMutation();
	const formRef = useRef<ResetPasswordFormHandle>(null);

	const handleSubmit = async (form: ResetUserPasswordFormInputs) => {
		const formHandle = formRef.current;
		if (!formHandle) return;

		try {
			const parsedParams = ResetPasswordParamsSchema.parse(params);

			await resetPassword({ ...parsedParams, ...form }).unwrap();

			toast.success('Successfully reset password');
			navigate({ to: '/auth/login', resetScroll: false });
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
