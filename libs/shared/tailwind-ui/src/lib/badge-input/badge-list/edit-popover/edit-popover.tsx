/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, {
	KeyboardEvent,
	ReactNode,
	RefObject,
	ChangeEvent,
	useState,
	useRef,
	MouseEvent
} from 'react';

import { BadgeItem } from '../../types';
import { useBadgeInputContext } from '../../context';
import { HoverCard } from '../../../hover-card';
import { cva, toast } from '../../../utils';
import { useCopyToClipboard } from '@/shared/hooks';

export type EditContentState = 'editing' | 'default';

const buttonStyle = cva({
	base: [
		'flex items-center py-1.5 px-2.5 text-[0.6875rem] font-semibold leading-[0.875rem] border-l border-l-border-primary hover:text-primary'
	],
	variants: { state: { editing: 'hidden', default: '' } }
});

const inputStyle = cva({
	base: ['flex items-center py-1.5 px-2.5 w-full'],
	variants: { state: { editing: '', default: 'hidden' } }
});

export interface EditPopoverContentProps {
	state: EditContentState;
	defaultValue: string;
	onDeleteClick: () => void;
	onEditClick: () => void;
	onValueChange: (value: string) => void;
	onCopyClick: () => void;
}

const EditPopoverContent = (props: EditPopoverContentProps) => {
	const {
		onDeleteClick,
		onEditClick,
		state,
		onValueChange,
		onCopyClick,
		defaultValue
	} = props;
	const [input, setInput] = useState(defaultValue);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;

		onValueChange(input);
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const handleEditClick = (_: MouseEvent) => {
		onEditClick();
		queueMicrotask(() => inputRef.current?.focus());
	};

	return (
		<div className="flex items-center bg-white rounded shadow-tooltip">
			<button
				className={buttonStyle({ state })}
				onClick={onDeleteClick}
				type="button"
			>
				delete
			</button>
			<button
				className={buttonStyle({ state })}
				onClick={handleEditClick}
				type="button"
			>
				edit
			</button>
			<button
				className={buttonStyle({ state })}
				onClick={onCopyClick}
				type="button"
			>
				copy
			</button>
			<div className={inputStyle({ state })} onKeyDown={handleSubmit}>
				<input
					className="outline-none text-[0.6875rem] font-semibold leading-[0.875rem] border-none p-0 focus:border-none focus:ring-transparent"
					type="text"
					value={input}
					onChange={handleChange}
					onClick={(e) => e.stopPropagation()}
					spellCheck={false}
					ref={inputRef}
				/>
			</div>
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
	const [state, setState] = useState<EditContentState>('default');
	const [isOpen, setIsOpen] = useState(false);
	const handleDeleteClick = () => onDeleteClick(badge.id);
	const handleEditClick = () => setState('editing');
	const closeDelay = 200;

	const handleSubmit = (value: string) => {
		onBadgeEdit(badge, value.trim());
		setState('default');
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) setTimeout(() => setState('default'), closeDelay);
		setIsOpen(isOpen);
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
			onOpenChange={handleOpenChange}
			container={listRef.current}
			arrow
			content={
				<EditPopoverContent
					state={state}
					onDeleteClick={handleDeleteClick}
					onEditClick={handleEditClick}
					onCopyClick={handleCopy}
					onValueChange={handleSubmit}
					defaultValue={badge.value}
				/>
			}
		>
			{children}
		</HoverCard>
	);
};
