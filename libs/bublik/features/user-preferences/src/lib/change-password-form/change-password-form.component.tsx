/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import {
	ProfileChangePassword,
	ProfileChangePasswordInputs
} from '@/shared/types';
import { ButtonTw, FormAlertError, TextField } from '@/shared/tailwind-ui';

import { zodResolver } from '@hookform/resolvers/zod';

const DEFAULT_VALUES: ProfileChangePassword = {
	current_password: '',
	new_password_confirm: '',
	new_password: ''
};

export type ChangePasswordFormHandle = {
	form: UseFormReturn<ProfileChangePassword>;
};

interface ChangePasswordFormProps {
	defaultValues?: ProfileChangePassword;
	onSubmit?: (form: ProfileChangePassword) => void;
}

export const ChangePasswordForm = forwardRef<
	ChangePasswordFormHandle,
	ChangePasswordFormProps
>((props, ref) => {
	const { onSubmit, defaultValues = DEFAULT_VALUES } = props;

	const form = useForm<ProfileChangePassword>({
		defaultValues,
		resolver: zodResolver(ProfileChangePasswordInputs)
	});

	useImperativeHandle(ref, () => ({ form }), [form]);

	const rootError = form.formState.errors.root;

	return (
		<form
			onSubmit={form.handleSubmit((d) => onSubmit?.(d))}
			className="flex flex-col gap-4"
			aria-label="Change password form"
		>
			{rootError ? (
				<FormAlertError title={'Error'} description={rootError.message} />
			) : null}
			<TextField
				name="current_password"
				label="Current password"
				type="password"
				placeholder="********"
				control={form.control}
			/>
			<TextField
				name="new_password"
				label="New password"
				type="password"
				placeholder="********"
				control={form.control}
			/>
			<TextField
				name="new_password_confirm"
				label="Confirm password"
				type="password"
				placeholder="********"
				control={form.control}
			/>
			<ButtonTw type="submit" disabled={form.formState.isSubmitting}>
				Change
			</ButtonTw>
		</form>
	);
});
