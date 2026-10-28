/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CreateUserFormContainer,
	UsersTableContainer
} from '@/bublik/features/admin-users';
import { ClassificationToolbar } from '@/bublik/features/result-classification';

export const AdminUsersPage = () => {
	return (
		<div className="flex flex-col h-full gap-1 p-2">
			<div className="flex flex-col flex-1 min-h-0 rounded bg-bg-primary">
				<ClassificationToolbar>
					<h1 className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
						Users
					</h1>
					<div className="flex items-center gap-2 ml-auto">
						<CreateUserFormContainer />
					</div>
				</ClassificationToolbar>
				<UsersTableContainer />
			</div>
		</div>
	);
};
