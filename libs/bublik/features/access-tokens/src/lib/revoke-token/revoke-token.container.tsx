/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useConfirm } from '@/shared/hooks';
import {
	getErrorMessage,
	useRevokeAccessTokenMutation
} from '@/services/bublik-api';
import {
	ButtonTw,
	ConfirmDialog,
	Icon,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import {
	DESTRUCTIVE_FILL_CLASS,
	ICON_ONLY_BUTTON_CLASS,
	ICON_ONLY_ICON_SIZE
} from '@/bublik/features/result-classification';

export interface RevokeTokenContainerProps {
	id: number;
	name: string;
	/** A labelled "Revoke" button instead of the icon-only one tables use. */
	showLabel?: boolean;
}

export const RevokeTokenContainer = ({
	id,
	name,
	showLabel = false
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
			{showLabel ? (
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					className={cn('gap-1', DESTRUCTIVE_FILL_CLASS)}
					aria-label={`Revoke token ${name}`}
					onClick={handleRevokeClick}
				>
					<Icon name="CrossSimple" size={14} />
					Revoke
				</ButtonTw>
			) : (
				<Tooltip content="Revoke this token" disableHoverableContent>
					<ButtonTw
						variant="destruction-secondary"
						size="xss"
						className={cn(
							'justify-center',
							ICON_ONLY_BUTTON_CLASS,
							DESTRUCTIVE_FILL_CLASS
						)}
						aria-label={`Revoke token ${name}`}
						onClick={handleRevokeClick}
					>
						<Icon name="CrossSimple" size={ICON_ONLY_ICON_SIZE} />
					</ButtonTw>
				</Tooltip>
			)}
		</>
	);
};
