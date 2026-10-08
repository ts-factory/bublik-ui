/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useConfirm } from '@/shared/hooks';
import { ConfirmDialog, Tooltip } from '@/shared/tailwind-ui';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { ActionButton } from '../action-button';
import { useAdminUsers } from '../users-table';

export type ActivateUserContainerProps = { email: string };

export const ActivateUserContainer = ({
	email
}: ActivateUserContainerProps) => {
	const { activateUser } = useAdminUsers();
	const { confirmation, isVisible, confirm, decline } = useConfirm();

	const handleActivateUserClick = async () => {
		const isConfirmed = await confirmation();

		if (!isConfirmed) return;

		trackEvent(analyticsEventNames.adminUsersActivateConfirm, {
			source: 'users_table'
		});

		await activateUser({ email });
	};

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title="Reactivate this user?"
				description="The user gets a new verification link and can sign in once the email is verified."
				confirmLabel="Reactivate"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<Tooltip content="Reactivate user" disableHoverableContent>
				<ActionButton
					aria-label="Reactivate user"
					icon="Refresh"
					className="text-text-expected hover:bg-badge-3"
					onClick={handleActivateUserClick}
				/>
			</Tooltip>
		</>
	);
};
