/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CreateUserFormContainer,
	UsersTableContainer
} from '@/bublik/features/admin-users';

export const AdminUsersPage = () => {
	return (
		<div className="p-2">
			<header className="px-6 py-4 bg-white rounded-t-xl">
				<CreateUserFormContainer />
			</header>
			<div>
				<UsersTableContainer />
			</div>
		</div>
	);
};
