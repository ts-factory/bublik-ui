/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';

import { UpdateUserProfileInfoInputs } from '@/shared/types';
import { useUpdateProfileInfoMutation } from '@/services/bublik-api';
import { useAuth } from '@/bublik/features/auth';
import { setErrorsOnForm } from '@/shared/utils';

import {
	EditUserProfile,
	EditUserProfileHandle
} from './edit-user-profile.component';
import { toast } from '@/shared/tailwind-ui';

export const EditUserProfileContainer = () => {
	const { user } = useAuth();
	const [updateProfile] = useUpdateProfileInfoMutation();
	const formHandle = useRef<EditUserProfileHandle>(null);

	const handleEditProfileInfoSubmit = async (
		form: UpdateUserProfileInfoInputs
	) => {
		if (!formHandle.current) return;

		try {
			await updateProfile(form).unwrap();
			toast.success('Updated profile info successfully!');
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: formHandle.current });
			toast.error('Failed to update profile info!');
		}
	};

	const defaultValues: UpdateUserProfileInfoInputs = {
		first_name: user?.firstName ?? '',
		last_name: user?.lastName ?? ''
	};

	return (
		<EditUserProfile
			defaultValues={defaultValues}
			onSubmit={handleEditProfileInfoSubmit}
			ref={formHandle}
		/>
	);
};
