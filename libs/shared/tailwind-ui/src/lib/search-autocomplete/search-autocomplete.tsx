/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithoutRef, useRef, useState, MouseEvent } from 'react';
import { useComboBoxState } from 'react-stately';
import { Key, useComboBox, useFilter } from 'react-aria';
import type { ComboBoxProps } from '@react-types/combobox';
import type { Node } from '@react-types/shared';

import { ListBox } from './list-box';
import { Popover } from './popover';
import { cva } from '../utils';
import { AddIcon } from './add-icon';
import { useClickOutside } from '@/shared/hooks';
import { Icon } from '../icon';

export { Item, Section } from 'react-stately';

export interface TagBadgeProps extends ComponentPropsWithoutRef<'button'> {
	text: string;
}

const TagBadge = ({ text, ...props }: TagBadgeProps) => {
	return (
		<button
			className="inline-flex text-[0.6875rem] font-medium leading-[0.875rem] text-text-primary bg-primary-wash px-2 py-[5px] rounded"
			{...props}
		>
			{text}
		</button>
	);
};

const inputWrapperStyles = cva({
	base: [
		'relative',
		'inline-flex',
		'flex-row',
		'items-center',
		'rounded-md',
		'overflow-hidden',
		'border',
		'transition-all',
		'hover:border-primary',
		'active:shadow-none',
		'bg-white',
		'flex-grow'
	],
	variants: {
		isFocused: {
			true: 'border-primary shadow-text-field',
			false: 'border-border-primary'
		}
	}
});

export const SearchAutocomplete = <T extends Record<string, unknown>>(
	props: ComboBoxProps<T>
) => {
	const { contains } = useFilter({ sensitivity: 'base' });
	const [tags, setTags] = useState<Node<T>[]>([]);
	const [input, setInput] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [selectedKey, setSelectedKey] = useState<Key>('');
	const inputRef = useRef(null);
	const listBoxRef = useRef(null);
	const popoverRef = useRef(null);

	const handleSelectionChange = (key: Key) => {
		const item = state.collection.getItem(key);
		const currentKeys = tags.map((tag) => tag.key);
		const isAlreadyPresent = currentKeys.includes(item?.key as Key);

		if (isAlreadyPresent) {
			setInput('');
			setSelectedKey('');
			return;
		}

		setTags((prev) => [...prev, item].filter(Boolean) as Node<T>[]);
		setInput('');
		setIsEditing(false);
		setSelectedKey('');
	};

	const handleInputChange = (value: string) => setInput(value);

	const handleTagClick = (tag: Node<T>) => () => {
		setTags((prev) => prev.filter((node) => node.key !== tag.key));
		setIsEditing(true);
		setInput(tag.textValue);
	};

	const handleDeleteTagClick =
		(tag: Node<T>) => (e: MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setTags((prev) => prev.filter((node) => node.key !== tag.key));
		};

	const state = useComboBoxState({
		...props,
		defaultFilter: contains,
		inputValue: input,
		selectedKey: selectedKey,
		onSelectionChange: handleSelectionChange,
		onInputChange: handleInputChange
	});

	const { inputProps, listBoxProps, labelProps } = useComboBox(
		{
			...props,
			inputRef,
			listBoxRef,
			popoverRef
		},
		state
	);

	const renderBody = () => {
		if (isEditing) {
			return (
				<input
					{...inputProps}
					autoFocus
					ref={inputRef}
					className="w-full px-3 py-2 outline-none appearance-none text-text-secondary text-[12px] font-medium leading-[1.5rem]"
				/>
			);
		}

		if (tags.length) {
			return (
				<div className="flex items-center w-full px-3">
					<div className="flex items-center w-full h-full gap-1">
						{tags.map((tag) => (
							<TagBadge
								key={tag.key}
								text={tag.textValue}
								onClick={handleTagClick(tag)}
								onContextMenu={handleDeleteTagClick(tag)}
							/>
						))}
					</div>
					<button
						aria-label="Add tag"
						className="text-text-menu justify-self-end"
						onClick={() => setIsEditing(true)}
					>
						<AddIcon />
					</button>
				</div>
			);
		}

		return (
			<button
				className="flex items-center w-full h-full gap-2 px-3"
				onClick={() => setIsEditing(true)}
			>
				<Icon name="Filter" size={24} className="text-text-menu" />
				<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
					{props.label}
				</span>
			</button>
		);
	};

	const wrapperRef = useClickOutside(() => {
		setIsEditing(false);
		state.close();
		state.setFocused(false);
	});

	return (
		<div
			className="relative inline-flex flex-col min-h-[40px] min-w-[192px]"
			ref={wrapperRef}
		>
			{(tags.length || isEditing) && (
				<label
					{...labelProps}
					className="absolute top-[-6px] left-[10px] bg-white z-10 text-[0.625rem] leading-[0.75rem] font-medium"
				>
					{props.label}
				</label>
			)}
			<div className={inputWrapperStyles({ isFocused: state.isFocused })}>
				{renderBody()}
			</div>
			{state.isOpen && (
				<Popover
					popoverRef={popoverRef}
					isOpen={state.isOpen}
					onClose={state.close}
				>
					<ListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
				</Popover>
			)}
		</div>
	);
};
