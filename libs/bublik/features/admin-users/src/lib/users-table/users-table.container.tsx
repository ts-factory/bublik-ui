/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	AdminCreateUserInputs,
	AdminDeleteUserInputs,
	AdminUpdateUserInputs
} from '@/shared/types';
import {
	useAdminCreateUserMutation,
	useAdminDeleteUserMutation,
	useAdminGetUsersQuery,
	useAdminUpdateUserMutation
} from '@/services/bublik-api';
import { cn, toast } from '@/shared/tailwind-ui';
import { useAuth } from '@/bublik/features/auth';

import {
	UsersTable,
	UsersTableEmpty,
	UsersTableError,
	UsersTableLoading
} from './users-table.component';

export const useAdminUsers = () => {
	const { user } = useAuth();

	const { data, isLoading, isFetching, error } = useAdminGetUsersQuery();
	const [createUserMutation] = useAdminCreateUserMutation();
	const [deleteUserMutation] = useAdminDeleteUserMutation();
	const [updateUserMutation] = useAdminUpdateUserMutation();

	const createUser = async (newUser: AdminCreateUserInputs) => {
		try {
			await createUserMutation(newUser);
		} catch (e: unknown) {
			toast.error('Failed to create new user');
		}
	};

	const deleteUser = async (deletedUser: AdminDeleteUserInputs) => {
		if (!user) return toast.error('You are not authenticated');

		try {
			if (user.email === deletedUser.email) {
				return toast.error('You are trying to delete yourself!');
			}

			await deleteUserMutation(deletedUser);
		} catch (e: unknown) {
			toast.error('Failed to delete user');
		}
	};

	const updateUser = async (updatedUser: AdminUpdateUserInputs) => {
		if (!user) return toast.error('You are not authenticated');

		try {
			await updateUserMutation(updatedUser);
		} catch (e) {
			toast.error('Failed to update user');
		}
	};

	return {
		users: data,
		isLoading,
		isFetching,
		error,
		createUser,
		deleteUser,
		updateUser
	};
};

export const UsersTableContainer = () => {
	const { isFetching, isLoading, error, users } = useAdminUsers();

	if (isLoading) return <UsersTableLoading />;

	if (error) return <UsersTableError error={error} />;

	if (!users || !users.length) return <UsersTableEmpty />;

	return (
		<div className={cn(isFetching && 'pointer-events-none opacity-40')}>
			<UsersTable users={users} />
		</div>
	);
};
