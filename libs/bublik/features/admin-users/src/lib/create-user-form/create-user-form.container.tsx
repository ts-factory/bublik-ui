/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { AdminCreateUserInputs } from '@/shared/types';
import { useAdminCreateUserMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import { toast } from '@/shared/tailwind-ui';

import {
	CreateUserFormHandle,
	CreateUserModal
} from './create-user-form.component';

export const CreateUserFormContainer = () => {
	const [open, setOpen] = useState(false);
	const [createUser] = useAdminCreateUserMutation();
	const formRef = useRef<CreateUserFormHandle>(null);

	const handleCreateUser = async (input: AdminCreateUserInputs) => {
		const form = formRef.current;
		if (!form) return;

		try {
			await createUser(input).unwrap();
			setOpen(false);
			toast.success(
				"A verification link has been sent to the user's email address"
			);
		} catch (e: unknown) {
			setErrorsOnForm(e, {
				handle: form,
				onSetError: (key, error, handle) => {
					if (!(key === 'password' || key === 'password_confirm')) {
						return;
					}

					handle.setError('password', error);
					handle.setError('password_confirm', error);
				}
			});
		}
	};

	return (
		<CreateUserModal
			open={open}
			onOpenChange={setOpen}
			onSubmit={handleCreateUser}
			ref={formRef}
		/>
	);
};
