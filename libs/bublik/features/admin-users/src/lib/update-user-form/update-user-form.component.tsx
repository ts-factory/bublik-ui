/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AdminUpdateUserInputs, AdminUpdateUserSchema } from '@/shared/types';
import { ButtonTw, FormAlertError, TextField } from '@/shared/tailwind-ui';

import { UsersModalLayout } from '../modal-layout';
import { forwardRef, useImperativeHandle } from 'react';

export type AdminUpdateUserFormHandle = UseFormReturn<AdminUpdateUserInputs>;

export interface UpdateUserFormProps {
	defaultValues?: AdminUpdateUserInputs;
	onSubmit?: (input: AdminUpdateUserInputs) => void;
	error?: string;
}

export const UpdateUserForm = forwardRef<
	AdminUpdateUserFormHandle,
	UpdateUserFormProps
>((props, ref) => {
	const { defaultValues, onSubmit } = props;

	const form = useForm<AdminUpdateUserInputs>({
		defaultValues,
		resolver: zodResolver(AdminUpdateUserSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	const rootError = form.formState.errors.root;

	return (
		<UsersModalLayout label="Update User">
			<form
				onSubmit={form.handleSubmit((input) => onSubmit?.(input))}
				className="flex flex-col gap-4"
			>
				{rootError ? (
					<div className="mb-6">
						<FormAlertError title={'Error'} description={rootError.message} />
					</div>
				) : null}
				<TextField
					name="first_name"
					label="First name"
					placeholder="John"
					control={form.control}
				/>
				<TextField
					name="last_name"
					label="Last name"
					placeholder="Doe"
					control={form.control}
				/>
				<TextField
					name={'password'}
					label="Password"
					type="password"
					placeholder="********"
					control={form.control}
				/>
				<ButtonTw type="submit">Update</ButtonTw>
			</form>
		</UsersModalLayout>
	);
});
