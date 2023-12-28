/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	useState,
	KeyboardEvent,
	useRef,
	ReactNode,
	FocusEvent,
	ChangeEvent,
	MouseEvent,
	useMemo,
	useCallback,
	forwardRef
} from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { mergeRefs } from '@react-aria/utils';

import { useClickOutside } from '@/shared/hooks';

import { BadgeItem } from './types';
import { parseBadgeString } from './utils';
import { BadgeInputContext } from './context';
import { InputLabel } from '../input-label';
import { BadgeList } from './badge-list';
import { cn } from '../utils';

export interface BadgeInputProps {
	label?: string;
	onBadgesChange?: (badges: BadgeItem[]) => void;
	badges?: BadgeItem[];
	placeholder?: string;
	disabled?: boolean;
	icon?: ReactNode;
	name?: string;
}

export const BadgeInput = forwardRef<HTMLDivElement, BadgeInputProps>(
	(
		{ label, onBadgesChange, badges = [], placeholder, icon, disabled, name },
		ref
	) => {
		const [value, setValue] = useState('');
		const [isKeyReleased, setIsKeyReleased] = useState(false);
		const [isFocused, setIsFocused] = useState(false);
		const inputRef = useRef<HTMLInputElement>(null);

		/**
    |--------------------------------------------------
    | HANDLE INPUT
    |--------------------------------------------------
    */

		const handleKeyDown = (e: KeyboardEvent) => {
			const { key } = e;
			const input = value.trim();

			if (
				key === 'Enter' &&
				input.length &&
				!badges.some((badge) => badge.value === input)
			) {
				e.preventDefault();

				const parsedBadges: BadgeItem[] = parseBadgeString(input).map(
					(value) => ({
						id: nanoid(4),
						value,
						originalValue: value,
						isExpression: false
					})
				);
				const newBadgesValue = [...badges, ...parsedBadges];

				setValue('');
				onBadgesChange?.(newBadgesValue);
			}

			if (
				key === 'Backspace' &&
				!value.length &&
				badges.length &&
				isKeyReleased
			) {
				e.preventDefault();

				const badgesCopy = [...badges];
				const poppedBadge = badgesCopy.pop();

				setValue(poppedBadge?.value || '');
				onBadgesChange?.(badgesCopy);
			}

			setIsKeyReleased(false);
		};

		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			setValue(e.target.value);
		};

		const handleKeyUp = (_e: KeyboardEvent) => setIsKeyReleased(true);

		/**
    |--------------------------------------------------
    | HANDLE SCROLL AND FOCUS
    |--------------------------------------------------
    */

		const clickRef = useClickOutside(() => setIsFocused(false));
		const handleClick = (_: MouseEvent) => {
			setIsFocused(true);
			inputRef.current?.focus();
		};

		const handleFocus = (_: FocusEvent<HTMLInputElement>) => setIsFocused(true);
		const handleBlur = (_: FocusEvent<HTMLInputElement>) => setIsFocused(false);

		/**
    |--------------------------------------------------
    | EDITING BADGES
    |--------------------------------------------------
    */

		const handleBadgeEdit = useCallback(
			(editedBadge: BadgeItem, newValue: string) => {
				const copyArr = badges.slice();

				const indexOfItem = copyArr.findIndex(
					(badge) => badge.id === editedBadge.id
				);

				copyArr[indexOfItem] = { ...copyArr[indexOfItem], value: newValue };

				onBadgesChange?.(copyArr.filter((badge) => badge.value));
			},
			[onBadgesChange, badges]
		);

		const handleBadgeDeleteClick = useCallback(
			(idOfBadgeToDelete: string) => {
				const filtered = badges.filter(
					(badge) => badge.id !== idOfBadgeToDelete
				);

				onBadgesChange?.(filtered);
			},
			[onBadgesChange, badges]
		);

		const contextValue = useMemo<BadgeInputContext>(
			() => ({
				onBadgeEdit: handleBadgeEdit,
				onDeleteClick: handleBadgeDeleteClick
			}),
			[handleBadgeDeleteClick, handleBadgeEdit]
		);

		return (
			<BadgeInputContext.Provider value={contextValue}>
				<div
					className={cn(
						'relative flex items-center w-full bg-white border border-border-primary rounded-md hover:border-primary transition-all min-h-[40px]',
						isFocused && 'border-primary shadow-text-field',
						disabled &&
							'cursor-not-allowed border-border-primary shadow-none hover:border-border-primary bg-bg-body'
					)}
					onClick={handleClick}
					data-testid="tw-badge-input"
					ref={mergeRefs(ref, clickRef)}
				>
					{label ? (
						<InputLabel
							className="absolute h-3 bg-white -top-3 left-2"
							htmlFor={name}
						>
							{label}
						</InputLabel>
					) : null}
					{icon ? (
						<div className="grid pl-2 place-items-center text-primary">
							{icon}
						</div>
					) : null}

					<div className="flex flex-wrap flex-grow h-full">
						{!disabled ? <BadgeList label={label} badges={badges} /> : null}
						<input
							className="flex w-full outline-none disabled:bg-bg-body p-2 cursor-[inherit] bg-transparent border-none text-text-secondary focus:ring-transparent  "
							value={value}
							id={label}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							onKeyUp={handleKeyUp}
							onFocus={handleFocus}
							onBlur={handleBlur}
							placeholder={placeholder}
							ref={inputRef}
							disabled={disabled}
							name={name}
							autoComplete="off"
						/>
					</div>
				</div>
			</BadgeInputContext.Provider>
		);
	}
);
