/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useImperativeHandle } from 'react';
import { Link } from 'react-router-dom';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ButtonTw, FormAlertError, TextField } from '@/shared/tailwind-ui';
import { LoginFormInputs, LoginFormSchema } from '@/shared/types';

import { AuthFormLayout } from '../auth-form-layout';

export type LoginFormHandle = UseFormReturn<LoginFormInputs>;

type LoginFormProps = {
	onSubmit?: (form: LoginFormInputs) => void;
	defaultValues?: LoginFormInputs;
};

export const LoginForm = forwardRef<LoginFormHandle, LoginFormProps>(
	(props, ref) => {
		const { onSubmit, defaultValues = { email: '', password: '' } } = props;

		const form = useForm<LoginFormInputs>({
			defaultValues,
			resolver: zodResolver(LoginFormSchema)
		});

		useImperativeHandle(ref, () => form, [form]);

		const rootError = form.formState.errors.root;

		return (
			<AuthFormLayout label="Sign in to your account">
				{rootError ? (
					<div className="mb-6">
						<FormAlertError title={'Error'} description={rootError.message} />
					</div>
				) : null}
				<form
					className="flex flex-col gap-6"
					onSubmit={form.handleSubmit((form) => onSubmit?.(form))}
				>
					<TextField
						name="email"
						label="Email"
						placeholder="Email"
						control={form.control}
					/>
					<TextField
						name="password"
						label="Password"
						placeholder="Password"
						type="password"
						control={form.control}
					/>
					<div className="flex items-center justify-end">
						<Link
							to="/auth/forgot"
							className="text-sm font-medium text-primary hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					<ButtonTw type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isLoading ? '...' : 'Sign in'}
					</ButtonTw>
				</form>
			</AuthFormLayout>
		);
	}
);
