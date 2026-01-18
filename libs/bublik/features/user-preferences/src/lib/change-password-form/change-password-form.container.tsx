/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';

import { ProfileChangePassword } from '@/shared/types';
import { useChangePasswordMutation } from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';
import { setErrorsOnForm } from '@/shared/utils';

import {
	ChangePasswordForm,
	ChangePasswordFormHandle
} from './change-password-form.component';

export const ChangePasswordFormContainer = () => {
	const formRef = useRef<ChangePasswordFormHandle>(null);
	const [changePassword] = useChangePasswordMutation();

	const handleChangePassword = async (form: ProfileChangePassword) => {
		try {
			await changePassword(form).unwrap();
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

	return <ChangePasswordForm onSubmit={handleChangePassword} ref={formRef} />;
};
