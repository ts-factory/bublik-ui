/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AnyAction } from '@reduxjs/toolkit';

import { LoginFormInputs } from '@/shared/types';
import { bublikAPI, useLoginMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';
import { toast } from '@/shared/tailwind-ui';

import { LoginForm, LoginFormHandle } from './login-form.component';
import { useLoginRedirect } from './login-form.hooks';

type LoginFormContainerProps = {
	/** The login page's `redirect_url`: the absolute URL to return to. */
	redirectUrl?: string;
};

export const LoginFormContainer = ({
	redirectUrl
}: LoginFormContainerProps) => {
	const dispatch = useDispatch();
	const redirect = useLoginRedirect();
	const [login] = useLoginMutation();
	const formRef = useRef<LoginFormHandle>(null);

	const handleSubmit = async (form: LoginFormInputs) => {
		if (!formRef.current) return;
		const formHandle = formRef.current;

		try {
			const { user } = await login(form).unwrap();

			dispatch(
				bublikAPI.util.upsertQueryData('me', undefined, {
					...user
				}) as unknown as AnyAction
			);

			redirect(redirectUrl);
		} catch (e: unknown) {
			toast.error('Failed to login!');
			setErrorsOnForm(e, { handle: formHandle });
		}
	};

	return <LoginForm onSubmit={handleSubmit} ref={formRef} />;
};
