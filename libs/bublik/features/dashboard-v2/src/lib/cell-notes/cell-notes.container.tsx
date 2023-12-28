/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAuth } from '@/bublik/features/auth';
import {
	BUBLIK_TAG,
	bublikAPI,
	useDeleteCompromisedStatusMutation,
	useLazyGetRunDetailsQuery
} from '@/services/bublik-api';
import {
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
	toast,
	ConfirmDialog
} from '@/shared/tailwind-ui';
import { formatTimeToAPI } from '@/shared/utils';

import { CellNote } from './cell-notes.component';
import { useConfirm } from '@/shared/hooks';

interface CellNotesContainerProps {
	runId: number | string;
	date: Date;
}

export const CellNotesContainer = (props: CellNotesContainerProps) => {
	const { runId, date } = props;
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const { confirmation, isVisible, confirm, decline } = useConfirm();

	const { isAdmin } = useAuth();
	const [fetchCompromiseStatus, { compromised }] = useLazyGetRunDetailsQuery({
		selectFromResult: ({ data }) => ({ compromised: data?.compromised })
	});
	const [deleteCompromiseStatus] = useDeleteCompromisedStatusMutation();

	const handleOpenChange = async (open: boolean) => {
		if (!open) return setOpen(open);

		try {
			await fetchCompromiseStatus(runId).unwrap();
		} catch (e: unknown) {
			toast.error('Failed to run info');
		}

		setOpen(open);
	};

	const handleDeleteCompromiseStatus = async () => {
		const invalidateTags = [
			{ type: BUBLIK_TAG.DashboardData },
			{ type: BUBLIK_TAG.DashboardData, id: formatTimeToAPI(date) }
		];

		try {
			const confirmed = await confirmation();

			if (!confirmed) return;

			await deleteCompromiseStatus(runId);

			dispatch(bublikAPI.util.invalidateTags(invalidateTags));

			toast.success('Removed compromised status');

			setOpen(false);
		} catch (e: unknown) {
			toast.error('Failed to remove compromise status');
		}
	};

	return (
		<ConfirmDialog
			open={isVisible}
			title="Are you sure you want to remove compromised status?"
			description="This action cannot be undone. This will remove compromised status for this run."
			confirmLabel="Remove"
			onCancelClick={decline}
			onConfirmClick={confirm}
		>
			<div className="flex items-center">
				<Popover open={open} onOpenChange={handleOpenChange}>
					<PopoverTrigger
						className={cn(
							'p-1 hover:bg-primary-wash text-primary transition-colors rounded-md',
							open && 'bg-primary text-white hover:text-white hover:bg-primary'
						)}
					>
						<Icon name="PaperListText" size={16} />
					</PopoverTrigger>
					<PopoverContent
						sideOffset={4}
						align="end"
						className="bg-white py-2 px-3 shadow-popover rounded-md flex flex-col gap-1 max-w-xs"
					>
						{compromised ? (
							<CellNote
								bugId={compromised.bug_id}
								bugUrl={compromised.bug_url}
								comment={compromised.comment}
								isAdmin={isAdmin}
								onDeleteClick={handleDeleteCompromiseStatus}
							/>
						) : null}
					</PopoverContent>
				</Popover>
			</div>
		</ConfirmDialog>
	);
};
