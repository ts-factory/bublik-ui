/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { AdminUpdateUserInputs } from '@/shared/types';
import { Dialog, DialogTrigger, toast, Tooltip } from '@/shared/tailwind-ui';
import { useAdminUpdateUserMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import { ActionButton } from '../action-button';
import {
	AdminUpdateUserFormHandle,
	UpdateUserForm
} from './update-user-form.component';

type UpdateUserFormModalContainerProps = {
	defaultValues: AdminUpdateUserInputs;
};

export const UpdateUserFormModalContainer = ({
	defaultValues
}: UpdateUserFormModalContainerProps) => {
	const [updateUser] = useAdminUpdateUserMutation();
	const [open, setOpen] = useState(false);
	const formRef = useRef<AdminUpdateUserFormHandle>(null);

	const handleUpdateUser = async (input: AdminUpdateUserInputs) => {
		try {
			await updateUser({
				email: input.email,
				first_name: input.first_name || undefined,
				last_name: input.last_name || undefined,
				password: input.password || undefined
			}).unwrap();
			setOpen(false);
			toast.success('Updated user successfully!');
		} catch (e: unknown) {
			if (formRef.current) setErrorsOnForm(e, { handle: formRef.current });
			toast.error('Failed to update user data!');
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip content="Edit user" disableHoverableContent>
				<DialogTrigger asChild>
					<ActionButton aria-label="Edit User" icon="Edit" />
				</DialogTrigger>
			</Tooltip>
			<UpdateUserForm
				onSubmit={handleUpdateUser}
				defaultValues={defaultValues}
				ref={formRef}
			/>
		</Dialog>
	);
};
