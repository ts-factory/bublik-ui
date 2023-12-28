/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';

import { AdminUpdateUserInputs, User } from '@/shared/types';
import { Badge } from '@/shared/tailwind-ui';
import { upperCaseFirstLetter } from '@/shared/utils';

import { UpdateUserFormModalContainer } from '../update-user-form';
import { getBadgeColorByRole } from './users-table.utils';
import { DeactivateUserContainer } from '../deactivate-user';

const helper = createColumnHelper<User>();

export const columns = [
	helper.display({
		header: 'Actions',
		cell: (cell) => {
			const user = cell.row.original;

			const defaultUpdateValues: AdminUpdateUserInputs = {
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name
			};

			return (
				<div className="flex items-center gap-2">
					<UpdateUserFormModalContainer defaultValues={defaultUpdateValues} />
					<DeactivateUserContainer email={user.email} />
				</div>
			);
		}
	}),
	helper.accessor('roles', {
		header: 'Role',
		cell: (cell) => {
			return (
				<Badge className={getBadgeColorByRole(cell.getValue<User['roles']>())}>
					{upperCaseFirstLetter(cell.getValue<string>())}
				</Badge>
			);
		}
	}),
	helper.accessor('first_name', {
		header: 'First name'
	}),
	helper.accessor('last_name', {
		header: 'Last name'
	}),
	helper.accessor('is_active', {
		header: 'Active'
	}),
	helper.accessor('email', {
		header: 'Email',
		cell: (cell) => {
			return (
				<a
					href={`mailto:${cell.getValue<string>()}`}
					className="hover:underline text-primary"
				>
					{cell.getValue<string>()}
				</a>
			);
		}
	})
];
