/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AnyAction } from '@reduxjs/toolkit';

import { useRouter } from '@tanstack/react-router';

import {
	currentLocation,
	resolveTo,
	routes,
	useRenderedLocation,
	type To
} from '@/router';

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
	const router = useRouter();
	const dispatch = useDispatch();
	const { searchStr } = useRenderedLocation();

	const navigate = (to: To, options?: { replace?: boolean }) => {
		const target = resolveTo(to, currentLocation(router).pathname);

		void router.navigate({ ...target, ...options, resetScroll: false });
	};
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

			const whereToRedirect = new URLSearchParams(searchStr).get(
				'redirect_url'
			);

			// Back to the exact pre-login URL, basepath stripped (a push)
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
