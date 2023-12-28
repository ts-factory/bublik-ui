/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	ButtonTw,
	FormAlertError,
	TextField
} from '@/shared/tailwind-ui';
import {
	ForgotPasswordInputs,
	ForgotPasswordSchema
} from '@/shared/types';

import { AuthFormLayout } from '../auth-form-layout';

export type ForgotPasswordFormHandle = UseFormReturn<ForgotPasswordInputs>;

export type ForgotPasswordFormProps = {
	onSubmit: (form: ForgotPasswordInputs) => void;
	defaultValues?: ForgotPasswordInputs;
};

export const ForgotPasswordForm = forwardRef<
	ForgotPasswordFormHandle,
	ForgotPasswordFormProps
>((props, ref) => {
	const { onSubmit, defaultValues = { email: '' } } = props;

	const form = useForm<ForgotPasswordInputs>({
		defaultValues,
		resolver: zodResolver(ForgotPasswordSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	const rootError = form.formState.errors.root;

	return (
		<AuthFormLayout
			label="Forgot Password"
			description="If you forgot your password we will send you an email with link to reset it"
		>
			{rootError ? (
				<div className="mb-6">
					<FormAlertError title={'Error'} description={rootError.message} />
				</div>
			) : null}
			<form
				onSubmit={form.handleSubmit((form) => onSubmit(form))}
				className="flex flex-col gap-6"
			>
				<TextField
					name="email"
					label="Email"
					placeholder="Email"
					control={form.control}
				/>
				<ButtonTw type="submit" disabled={form.formState.isSubmitting}>
					Send Link
				</ButtonTw>
			</form>
		</AuthFormLayout>
	);
});
