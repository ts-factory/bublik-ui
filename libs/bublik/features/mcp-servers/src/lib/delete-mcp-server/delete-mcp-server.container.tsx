/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useConfirm } from '@/shared/hooks';
import {
	getErrorMessage,
	useDeleteMcpServerMutation
} from '@/services/bublik-api';
import { ButtonTw, ConfirmDialog, toast } from '@/shared/tailwind-ui';

export interface DeleteMcpServerContainerProps {
	id: number;
	name: string;
}

export const DeleteMcpServerContainer = ({
	id,
	name
}: DeleteMcpServerContainerProps) => {
	const [deleteServer] = useDeleteMcpServerMutation();
	const { confirmation, isVisible, confirm, decline } = useConfirm();

	const handleDeleteClick = async () => {
		const isConfirmed = await confirmation();

		if (!isConfirmed) return;

		try {
			await deleteServer(id).unwrap();
			toast.success(`Server "${name}" deleted`);
		} catch (error: unknown) {
			const { title, description } = getErrorMessage(error);
			toast.error(`${title}: ${description}`);
		}
	};

	return (
		<>
			<ConfirmDialog
				open={isVisible}
				title={`Delete "${name}"?`}
				description="The assistant stops using this server's tools from your next chat message on. Its stored headers are deleted with it."
				confirmLabel="Delete"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<ButtonTw
				variant="outline"
				size="xss"
				aria-label={`Delete server ${name}`}
				onClick={handleDeleteClick}
			>
				Delete
			</ButtonTw>
		</>
	);
};
