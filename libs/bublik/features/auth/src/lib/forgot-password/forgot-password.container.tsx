/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ForgotPasswordInputs } from '@/shared/types';
import { useRequestResetPasswordMutation } from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

import {
	ForgotPasswordForm,
	ForgotPasswordFormHandle
} from './forgot-password.component';

export const ForgotPasswordFormContainer = () => {
	const navigate = useNavigate();
	const [requestPasswordReset] = useRequestResetPasswordMutation();
	const formRef = useRef<ForgotPasswordFormHandle>(null);

	const handleSubmit = async (form: ForgotPasswordInputs) => {
		const formHandle = formRef.current;

		if (!formHandle) return;

		try {
			await requestPasswordReset(form).unwrap();

			toast.success('Email with link to reset password has been sent!');
			navigate('/auth/login');
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: formHandle });
			toast.error('Failed to send reset password email!');
		}
	};

	return <ForgotPasswordForm onSubmit={handleSubmit} ref={formRef} />;
};
