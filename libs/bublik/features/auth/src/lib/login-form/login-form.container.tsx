/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { To, useNavigate, useSearchParams } from 'react-router-dom';
import { AnyAction } from '@reduxjs/toolkit';

import { routes } from '@/router';

import { LoginFormInputs } from '@/shared/types';
import { bublikAPI, useLoginMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';
import { toast } from '@/shared/tailwind-ui';

import { LoginForm, LoginFormHandle } from './login-form.component';
import { getRouterUrl } from '../auth.utils';

type LoginFormContainerProps = {
	redirectOnSuccessTo?: To;
};

export const LoginFormContainer = (props: LoginFormContainerProps) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [searchParams] = useSearchParams();
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

			const whereToRedirect = searchParams.get('redirect_url');

			if (whereToRedirect) return navigate(getRouterUrl(whereToRedirect));

			return props.redirectOnSuccessTo
				? navigate(props.redirectOnSuccessTo, { replace: true })
				: navigate(routes.dashboard({}), { replace: true });
		} catch (e: unknown) {
			toast.error('Failed to login!');
			setErrorsOnForm(e, { handle: formHandle });
		}
	};

	return <LoginForm onSubmit={handleSubmit} ref={formRef} />;
};
