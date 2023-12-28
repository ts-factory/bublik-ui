/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useConfirm } from '@/shared/hooks';
import { ConfirmDialog, Tooltip } from '@/shared/tailwind-ui';

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

		await deleteUser({ email });
	};

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title="Are you sure you want to deactivate user?"
				description="This action cannot be undone. This will deactivate user account and it will be unavailable."
				confirmLabel="Deactivate"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<Tooltip content="Deactive user" disableHoverableContent>
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
