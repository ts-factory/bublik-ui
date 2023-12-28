/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	UpdateUserProfileInfoInputs,
	UpdateUserProfileInfoSchema
} from '@/shared/types';
import { ButtonTw, TextField } from '@/shared/tailwind-ui';

export type EditUserProfileHandle = UseFormReturn<UpdateUserProfileInfoInputs>;

interface EditUserProfileProps {
	onSubmit: (input: UpdateUserProfileInfoInputs) => void;
	defaultValues?: UpdateUserProfileInfoInputs;
}

export const EditUserProfile = forwardRef<
	EditUserProfileHandle,
	EditUserProfileProps
>(({ onSubmit, defaultValues }, ref) => {
	const form = useForm<UpdateUserProfileInfoInputs>({
		defaultValues,
		resolver: zodResolver(UpdateUserProfileInfoSchema)
	});

	useImperativeHandle(ref, () => form, [form]);

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col max-w-md gap-6">
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
			</div>
			<div className="self-start">
				<ButtonTw type="submit" className="inline-flex">
					Update profile
				</ButtonTw>
			</div>
		</form>
	);
});
