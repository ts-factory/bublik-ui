/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useConfirm } from '@/shared/hooks';
import {
	getErrorMessage,
	useRevokeAccessTokenMutation
} from '@/services/bublik-api';
import { ButtonTw, ConfirmDialog, toast } from '@/shared/tailwind-ui';

export interface RevokeTokenContainerProps {
	id: number;
	name: string;
}

export const RevokeTokenContainer = ({
	id,
	name
}: RevokeTokenContainerProps) => {
	const [revokeToken] = useRevokeAccessTokenMutation();
	const { confirmation, isVisible, confirm, decline } = useConfirm();

	const handleRevokeClick = async () => {
		const isConfirmed = await confirmation();

		if (!isConfirmed) return;

		try {
			await revokeToken(id).unwrap();
			toast.success(`Token "${name}" revoked`);
		} catch (error: unknown) {
			const { title, description } = getErrorMessage(error);
			toast.error(`${title}: ${description}`);
		}
	};

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title={`Revoke "${name}"?`}
				description="Any client configured with this token stops working on its very next request. This cannot be undone, but you can issue a replacement."
				confirmLabel="Revoke"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<ButtonTw
				variant="outline"
				size="xss"
				aria-label={`Revoke token ${name}`}
				onClick={handleRevokeClick}
			>
				Revoke
			</ButtonTw>
		</>
	);
};
