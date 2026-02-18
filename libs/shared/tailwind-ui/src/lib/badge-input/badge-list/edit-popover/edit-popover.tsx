/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, RefObject, useState } from 'react';

import { BadgeItem } from '../../types';
import { useBadgeInputContext } from '../../context';
import { HoverCard } from '../../../hover-card';
import { toast } from '../../../utils';
import { useCopyToClipboard } from '@/shared/hooks';

const ACTION_BUTTON_CLASS_NAME =
	'flex items-center px-2.5 py-1.5 text-[0.6875rem] font-semibold leading-[0.875rem] hover:text-primary';

export interface EditPopoverContentProps {
	onDeleteClick: () => void;
	onEditClick: () => void;
	onCopyClick: () => void;
}

const EditPopoverContent = (props: EditPopoverContentProps) => {
	const { onDeleteClick, onEditClick, onCopyClick } = props;

	return (
		<div className="flex items-center [&>:not(:first-child)]:border-l border-l-border-primary rounded bg-white shadow-tooltip">
			<button
				className={ACTION_BUTTON_CLASS_NAME}
				onClick={onDeleteClick}
				type="button"
			>
				delete
			</button>
			<button
				className={ACTION_BUTTON_CLASS_NAME}
				onClick={onEditClick}
				type="button"
			>
				edit
			</button>
			<button
				className={ACTION_BUTTON_CLASS_NAME}
				onClick={onCopyClick}
				type="button"
			>
				copy
			</button>
		</div>
	);
};

export type EditPopoverProps = {
	badge: BadgeItem;
	children?: ReactNode;
	listRef: RefObject<HTMLUListElement>;
};

export const EditPopover = ({ badge, listRef, children }: EditPopoverProps) => {
	const { onDeleteClick, onBadgeEdit } = useBadgeInputContext();
	const [isOpen, setIsOpen] = useState(false);
	const closeDelay = 200;
	const handleDeleteClick = () => {
		onDeleteClick(badge.id);
		setIsOpen(false);
	};

	const handleEditClick = () => {
		onBadgeEdit(badge);
		setIsOpen(false);
	};

	const [, copy] = useCopyToClipboard({
		onSuccess(copiedText) {
			toast.success(`Copied ${copiedText} to clipboard`);
		}
	});

	const handleCopy = () => {
		copy(badge.value);
	};

	return (
		<HoverCard
			side="top"
			open={isOpen}
			openDelay={0}
			closeDelay={closeDelay}
			onOpenChange={setIsOpen}
			container={listRef.current}
			arrow
			content={
				<EditPopoverContent
					onDeleteClick={handleDeleteClick}
					onEditClick={handleEditClick}
					onCopyClick={handleCopy}
				/>
			}
		>
			{children}
		</HoverCard>
	);
};
