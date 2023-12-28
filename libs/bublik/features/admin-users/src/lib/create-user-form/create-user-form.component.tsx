/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	AdminCreateUserInputs,
	AdminCreateUserInputsSchema
} from '@/shared/types';
import {
	ButtonTw,
	Dialog,
	DialogTrigger,
	FormAlertError,
	TextField
} from '@/shared/tailwind-ui';

import { UsersModalLayout } from '../modal-layout';

export type CreateUserFormHandle = UseFormReturn<AdminCreateUserInputs>;

export interface CreateUserFormProps {
	defaultValues?: AdminCreateUserInputs;
	onSubmit?: (input: AdminCreateUserInputs) => void;
}

export const CreateUserForm = forwardRef<
	CreateUserFormHandle,
	CreateUserFormProps
>((props, ref) => {
	const { defaultValues, onSubmit } = props;

	const form = useForm<AdminCreateUserInputs>({
		defaultValues,
		resolver: zodResolver(AdminCreateUserInputsSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	return (
		<form
			onSubmit={form.handleSubmit((input) => onSubmit?.(input))}
			className="flex flex-col gap-4"
		>
			{form.formState.errors.root?.message ? (
				<div className="mb-6">
					<FormAlertError
						title="Error"
						description={form.formState.errors.root.message}
					/>
				</div>
			) : null}
			<TextField
				name="email"
				label="Email"
				placeholder="user@example.com"
				control={form.control}
			/>
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
				autoComplete="new-password"
				name="password"
				type="password"
				label="Password"
				placeholder="****"
				control={form.control}
			/>
			<TextField
				name="password_confirm"
				autoComplete="new-password"
				type="password"
				label="Password Confirm"
				placeholder="****"
				control={form.control}
			/>
			<ButtonTw type="submit">Create</ButtonTw>
		</form>
	);
});

export type CreateUserModalProps = ComponentProps<typeof CreateUserForm> &
	Pick<ComponentProps<typeof Dialog>, 'open' | 'onOpenChange'>;

export const CreateUserModal = forwardRef<
	CreateUserFormHandle,
	CreateUserModalProps
>(({ open, onOpenChange, ...props }, ref) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<ButtonTw>Create User</ButtonTw>
			</DialogTrigger>
			<UsersModalLayout label="Create User">
				<CreateUserForm {...props} ref={ref} />
			</UsersModalLayout>
		</Dialog>
	);
});
