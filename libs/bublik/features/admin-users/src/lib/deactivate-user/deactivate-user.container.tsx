/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useConfirm } from '@/shared/hooks';
import { ConfirmDialog, Tooltip } from '@/shared/tailwind-ui';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { ActionButton } from '../action-button';
import { useAdminUsers } from '../users-table';

export type DeleteUserContainerProps = { email: string };

export const DeactivateUserContainer = ({
	email
}: DeleteUserContainerProps) => {
	const { deleteUser } = useAdminUsers();
	const { confirmation, isVisible, confirm, decline } = useConfirm();

	const handleDeleteUserClick = async () => {
		const isConfirmed = await confirmation();

		if (!isConfirmed) return;

		trackEvent(analyticsEventNames.adminUsersDeactivateConfirm, {
			source: 'users_table'
		});

		await deleteUser({ email });
	};

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title="Deactivate this user?"
				description="The user is signed out everywhere and cannot sign in. An administrator can reactivate the account later."
				confirmLabel="Deactivate"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<Tooltip content="Deactivate user" disableHoverableContent>
				<ActionButton
					aria-label="Deactivate user"
					icon="CrossSimple"
					className="text-text-unexpected hover:bg-bg-fillError/20"
					onClick={handleDeleteUserClick}
				/>
			</Tooltip>
		</>
	);
};
