/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';

import { AdminUpdateUserInputs, User } from '@/shared/types';
import { Badge, Tooltip } from '@/shared/tailwind-ui';
import { ISSUE_ACTIONS_COLUMN_META } from '@/bublik/features/result-classification';
import {
	formatTimeToDot,
	formatTimestampToFull,
	upperCaseFirstLetter
} from '@/shared/utils';

import { UpdateUserFormModalContainer } from '../update-user-form';
import {
	getBadgeColorByRole,
	getBadgeStyleByStatus
} from './users-table.utils';
import { DeactivateUserContainer } from '../deactivate-user';
import { ActivateUserContainer } from '../activate-user';

const helper = createColumnHelper<User>();

/** Each column hugs its widest value; the table's gutter takes the rest. */
const TEXT_COLUMN_META = { width: 'minmax(6rem, max-content)' } as const;
const BADGE_COLUMN_META = { width: 'auto', badgeCell: true } as const;

export const columns = [
	helper.accessor('roles', {
		header: 'Role',
		meta: BADGE_COLUMN_META,
		cell: (cell) => {
			return (
				<Badge className={getBadgeColorByRole(cell.getValue<User['roles']>())}>
					{upperCaseFirstLetter(cell.getValue<string>())}
				</Badge>
			);
		}
	}),
	helper.accessor('first_name', {
		header: 'First name',
		meta: TEXT_COLUMN_META
	}),
	helper.accessor('last_name', {
		header: 'Last name',
		meta: TEXT_COLUMN_META
	}),
	helper.accessor('status', {
		header: 'Status',
		meta: BADGE_COLUMN_META,
		cell: (cell) => {
			const status = cell.getValue<User['status']>();
			const { variant, className } = getBadgeStyleByStatus(status);

			return (
				<Badge variant={variant} className={className}>
					{upperCaseFirstLetter(status)}
				</Badge>
			);
		}
	}),
	helper.accessor('date_joined', {
		header: 'Joined',
		meta: { width: 'auto' },
		cell: (cell) => (
			<Tooltip content={`Joined ${formatTimestampToFull(cell.getValue())}`}>
				<span className="tabular-nums">{formatTimeToDot(cell.getValue())}</span>
			</Tooltip>
		)
	}),
	helper.accessor('email', {
		header: 'Email',
		meta: { width: 'minmax(12rem, max-content)' },
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
	}),
	helper.display({
		id: 'actions',
		header: 'Actions',
		meta: ISSUE_ACTIONS_COLUMN_META,
		cell: (cell) => {
			const user = cell.row.original;

			const defaultUpdateValues: AdminUpdateUserInputs = {
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name
			};

			return (
				<div className="flex items-center gap-1 w-fit">
					<UpdateUserFormModalContainer defaultValues={defaultUpdateValues} />
					{user.status === 'deactivated' ? (
						<ActivateUserContainer email={user.email} />
					) : (
						<DeactivateUserContainer email={user.email} />
					)}
				</div>
			);
		}
	})
];

export const PINNED_LAST_COLUMNS = ['actions'] as const;
