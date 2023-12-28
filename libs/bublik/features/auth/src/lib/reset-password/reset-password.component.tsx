/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';

import { TextField, ButtonTw, FormAlertError } from '@/shared/tailwind-ui';
import {
	ResetUserPasswordFormInputs,
	ResetUserPasswordSchema
} from '@/shared/types';

import { AuthFormLayout } from '../auth-form-layout';

export type ResetPasswordFormHandle =
	UseFormReturn<ResetUserPasswordFormInputs>;

export type ChangePasswordFormProps = {
	onSubmit: (form: ResetUserPasswordFormInputs) => void;
	defaultValues?: ResetUserPasswordFormInputs;
};

export const ResetPasswordForm = forwardRef<
	ResetPasswordFormHandle,
	ChangePasswordFormProps
>((props, ref) => {
	const {
		onSubmit,
		defaultValues = { new_password: '', new_password_confirm: '' }
	} = props;
	const form = useForm<ResetUserPasswordFormInputs>({
		defaultValues,
		resolver: zodResolver(ResetUserPasswordSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	const rootError = form.formState.errors.root;

	return (
		<AuthFormLayout
			label="Reset password"
			description="Please enter your new password"
		>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
			>
				{rootError ? (
					<FormAlertError title={'Error'} description={rootError.message} />
				) : null}
				<TextField
					name="new_password"
					label="Password"
					type="password"
					placeholder="Password"
					control={form.control}
					autoComplete="new-password"
				/>
				<TextField
					name="new_password_confirm"
					label="Confirm Password"
					type="password"
					placeholder="Confirm Password"
					control={form.control}
					autoComplete="new-password"
				/>
				<ButtonTw type="submit" disabled={form.formState.isSubmitting}>
					Reset
				</ButtonTw>
			</form>
		</AuthFormLayout>
	);
});
