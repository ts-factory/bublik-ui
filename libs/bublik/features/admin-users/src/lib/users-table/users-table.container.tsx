/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	AdminActivateUserInputs,
	AdminCreateUserInputs,
	AdminDeleteUserInputs,
	AdminUpdateUserInputs
} from '@/shared/types';
import {
	getErrorMessage,
	useAdminActivateUserMutation,
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
	const [activateUserMutation] = useAdminActivateUserMutation();
	const [updateUserMutation] = useAdminUpdateUserMutation();

	// The backend explains what went wrong ("No user found with this email",
	// "Users cannot deactivate themselves", ...), so show that over a stock text
	const reportError = (e: unknown, fallback: string) =>
		toast.error(getErrorMessage(e).description || fallback);

	const createUser = async (newUser: AdminCreateUserInputs) => {
		try {
			await createUserMutation(newUser).unwrap();
		} catch (e: unknown) {
			reportError(e, 'Failed to create new user');
		}
	};

	const deleteUser = async (deletedUser: AdminDeleteUserInputs) => {
		if (!user) return toast.error('You are not authenticated');

		// Refused here as well as by the backend: an older backend would
		// deactivate the administrator for real
		if (user.email === deletedUser.email) {
			return toast.error('Users cannot deactivate themselves');
		}

		try {
			await deleteUserMutation(deletedUser).unwrap();
			toast.success('The user was deactivated');
		} catch (e: unknown) {
			reportError(e, 'Failed to deactivate user');
		}
	};

	const activateUser = async (activatedUser: AdminActivateUserInputs) => {
		if (!user) return toast.error('You are not authenticated');

		try {
			await activateUserMutation(activatedUser).unwrap();
			toast.success('A verification link has been sent to the user');
		} catch (e: unknown) {
			reportError(e, 'Failed to reactivate user');
		}
	};

	const updateUser = async (updatedUser: AdminUpdateUserInputs) => {
		if (!user) return toast.error('You are not authenticated');

		try {
			await updateUserMutation(updatedUser).unwrap();
		} catch (e: unknown) {
			reportError(e, 'Failed to update user');
		}
	};

	return {
		users: data,
		isLoading,
		isFetching,
		error,
		createUser,
		deleteUser,
		activateUser,
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
