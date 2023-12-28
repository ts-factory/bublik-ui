/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { ProfileChangePassword } from '@/shared/types';
import { useChangePasswordMutation } from '@/services/bublik-api';
import {
	ButtonTw,
	Dialog,
	DialogClose,
	DialogTrigger,
	Icon,
	ModalContent,
	toast
} from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

import {
	ChangePasswordForm,
	ChangePasswordFormHandle
} from './change-password-form.component';

export const ChangePasswordFormContainer = () => {
	const [open, setOpen] = useState(false);
	const formRef = useRef<ChangePasswordFormHandle>(null);
	const [changePassword] = useChangePasswordMutation();

	const handleChangePassword = async (form: ProfileChangePassword) => {
		try {
			await changePassword(form).unwrap();
			setOpen(false);
			toast.success('Successfully changed password!');
		} catch (e: unknown) {
			const form = formRef.current?.form;
			if (!form) return;
			setErrorsOnForm(e, {
				handle: form,
				onSetError: (key, error, form) => {
					if (!(key === 'new_password' || key === 'new_password_confirm')) {
						return;
					}

					form.setError('new_password', error);
					form.setError('new_password_confirm', error);
				}
			});
			toast.error('Failed to change password!');
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<ButtonTw>Change Password</ButtonTw>
			</DialogTrigger>
			<ModalContent className="w-full sm:max-w-md p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-10 relative overflow-auto max-h-[85vh]">
				<DialogClose className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary">
					<Icon name={'Cross'} size={14} />
				</DialogClose>
				<h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-text-primary">
					Change password
				</h1>
				<ChangePasswordForm onSubmit={handleChangePassword} ref={formRef} />
			</ModalContent>
		</Dialog>
	);
};
