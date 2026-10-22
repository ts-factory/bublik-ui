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
	useId,
	forwardRef
} from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { mergeRefs } from '@react-aria/utils';

import { useClickOutside } from '@/shared/hooks';
import {
	DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	formatKeyValueForDisplay
} from '@/shared/utils';

import { BadgeClassName, BadgeItem } from './types';
import { filterBadgeSuggestions, parseBadgeString } from './utils';
import { BadgeInputContext } from './context';
import {
	BadgeSuggestionList,
	getSuggestionOptionId
} from './badge-suggestions';
import { InputLabel } from '../input-label';
import { BadgeList } from './badge-list';
import { Popover, PopoverAnchor } from '../popover';
import { cn } from '../utils';

export interface BadgeInputProps {
	label?: string;
	labelTrailingContent?: ReactNode;
	onBadgesChange?: (badges: BadgeItem[]) => void;
	badges?: BadgeItem[];
	placeholder?: string;
	disabled?: boolean;
	icon?: ReactNode;
	trailingContent?: ReactNode;
	name?: string;
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
	/**
	 * Values to offer in a list as the user types, in the submit form
	 * (`name=value`), each row a checkbox ticked when its value is already a
	 * badge: ticking adds the badge, unticking removes it, and typing anything
	 * else still adds what is typed. Leave it out for a free-text-only field.
	 */
	suggestions?: readonly string[];
	suggestionsLoading?: boolean;
	/**
	 * Called when the field gets focus, so the suggestions can be fetched
	 * only once someone is about to use them.
	 */
	onSuggestionsRequest?: () => void;
	/** The badges' colours, and their chips' in the suggestion list. */
	badgeClassName?: BadgeClassName;
}

export const BadgeInput = forwardRef<HTMLDivElement, BadgeInputProps>(
	(
		{
			label,
			onBadgesChange,
			badges = [],
			placeholder,
			icon,
			disabled,
			name,
			keyValueDisplayDelimiter,
			keyValueSubmitDelimiter,
			labelTrailingContent,
			trailingContent,
			suggestions,
			suggestionsLoading = false,
			onSuggestionsRequest,
			badgeClassName
		},
		ref
	) => {
		const [value, setValue] = useState('');
		const [isKeyReleased, setIsKeyReleased] = useState(false);
		const [isFocused, setIsFocused] = useState(false);
		const [isListOpen, setIsListOpen] = useState(false);
		const [highlightedIndex, setHighlightedIndex] = useState(-1);
		const inputRef = useRef<HTMLInputElement>(null);
		const fieldRef = useRef<HTMLDivElement>(null);
		const listId = useId();
		const hasSuggestions = suggestions !== undefined;
		const formatBadgeValueForInput = useCallback(
			(badgeValue: string) =>
				formatKeyValueForDisplay(badgeValue, {
					displayDelimiter: keyValueDisplayDelimiter,
					submitDelimiter: keyValueSubmitDelimiter
				}),
			[keyValueDisplayDelimiter, keyValueSubmitDelimiter]
		);

		/**
    |--------------------------------------------------
    | SUGGESTIONS
    |--------------------------------------------------
    */

		const filteredSuggestions = useMemo(
			() =>
				filterBadgeSuggestions(suggestions ?? [], value, {
					displayDelimiter: keyValueDisplayDelimiter,
					submitDelimiter: keyValueSubmitDelimiter
				}),
			[suggestions, value, keyValueDisplayDelimiter, keyValueSubmitDelimiter]
		);
		const checkedSuggestions = useMemo(
			() => new Set(badges.map((badge) => badge.value)),
			[badges]
		);
		const suggestionItems = filteredSuggestions.items;
		const isListVisible =
			hasSuggestions &&
			isListOpen &&
			!disabled &&
			(suggestionItems.length > 0 || suggestionsLoading);
		const highlightedSuggestion = isListVisible
			? suggestionItems[highlightedIndex]
			: undefined;

		const openList = () => {
			if (!hasSuggestions) return;
			setIsListOpen(true);
		};

		const closeList = () => {
			setIsListOpen(false);
			setHighlightedIndex(-1);
		};

		// The list stays open and keeps what is typed, so several of the
		// matches can be ticked in a row.
		const handleToggleSuggestion = (suggestion: string) => {
			onBadgesChange?.(
				checkedSuggestions.has(suggestion)
					? badges.filter((badge) => badge.value !== suggestion)
					: [...badges, { id: nanoid(4), value: suggestion }]
			);
			inputRef.current?.focus();
		};

		/**
    |--------------------------------------------------
    | HANDLE INPUT
    |--------------------------------------------------
    */

		const handleKeyDown = (e: KeyboardEvent) => {
			const { key } = e;
			const input = value.trim();

			if (hasSuggestions && (key === 'ArrowDown' || key === 'ArrowUp')) {
				e.preventDefault();
				setIsKeyReleased(false);
				openList();

				const count = suggestionItems.length;
				if (!count) return;

				setHighlightedIndex((previous) => {
					if (!isListVisible) return key === 'ArrowDown' ? 0 : count - 1;
					if (key === 'ArrowDown') return (previous + 1) % count;
					return previous <= 0 ? count - 1 : previous - 1;
				});
				return;
			}

			// Only a row highlighted with the arrows takes Enter, which ticks or
			// unticks it: otherwise Enter adds what is typed, so expressions and
			// values not in the list still go in.
			if (
				key === 'Enter' &&
				highlightedSuggestion !== undefined &&
				!e.ctrlKey &&
				!e.metaKey
			) {
				e.preventDefault();
				setIsKeyReleased(false);
				handleToggleSuggestion(highlightedSuggestion);
				return;
			}

			if (
				key === 'Enter' &&
				input.length &&
				!badges.some((badge) => badge.value === input)
			) {
				e.preventDefault();

				const parsedConfig = {
					separator: ',',
					displayDelimiter:
						keyValueDisplayDelimiter ?? DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
					submitDelimiter:
						keyValueSubmitDelimiter ?? DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
				};

				const parsedBadges: BadgeItem[] = parseBadgeString(
					input,
					parsedConfig
				).map((value) => ({
					id: nanoid(4),
					value,
					originalValue: value,
					isExpression: false
				}));
				const newBadgesValue = [...badges, ...parsedBadges];

				setValue('');
				closeList();
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

				setValue(
					poppedBadge ? formatBadgeValueForInput(poppedBadge.value) : ''
				);
				onBadgesChange?.(badgesCopy);
			}

			setIsKeyReleased(false);
		};

		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			setValue(e.target.value);
			setHighlightedIndex(-1);
			openList();
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
			openList();
		};

		// Focus alone (tabbing through a form) only fetches the suggestions;
		// a click, typing or an arrow key opens the list.
		const handleFocus = (_: FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			onSuggestionsRequest?.();
		};
		const handleBlur = (_: FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			closeList();
		};

		/**
    |--------------------------------------------------
    | EDITING BADGES
    |--------------------------------------------------
    */

		const handleBadgeEdit = useCallback(
			(badgeToEdit: BadgeItem) => {
				setValue(formatBadgeValueForInput(badgeToEdit.value));
				onBadgesChange?.(badges.filter((badge) => badge.id !== badgeToEdit.id));
				queueMicrotask(() => inputRef.current?.focus());
			},
			[onBadgesChange, badges, formatBadgeValueForInput]
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

		const field = (
			<div
				className={cn(
					'relative flex items-center w-full bg-bg-primary border border-border-input rounded-md hover:border-primary transition-all min-h-[40px]',
					isFocused && 'border-primary shadow-text-field',
					disabled &&
						'cursor-not-allowed border-border-primary shadow-none hover:border-border-primary bg-bg-body'
				)}
				onClick={handleClick}
				data-testid="tw-badge-input"
				ref={mergeRefs(ref, clickRef, fieldRef)}
			>
				{label ? (
					<InputLabel
						className="absolute h-3 bg-bg-primary -top-3 left-2"
						htmlFor={name}
					>
						{label}
					</InputLabel>
				) : null}
				{labelTrailingContent ? (
					<div className="absolute -top-3 right-2 flex items-center bg-bg-primary px-1">
						{labelTrailingContent}
					</div>
				) : null}
				{icon ? (
					<div className="grid pl-2 place-items-center text-primary">
						{icon}
					</div>
				) : null}

				<div className="flex flex-wrap flex-grow h-full">
					{!disabled ? (
						<BadgeList
							label={label}
							badges={badges}
							keyValueDisplayDelimiter={keyValueDisplayDelimiter}
							keyValueSubmitDelimiter={keyValueSubmitDelimiter}
							badgeClassName={badgeClassName}
						/>
					) : null}
					<input
						className="flex w-full outline-none placeholder:font-normal disabled:bg-bg-body pr-2 pl-4 py-2 cursor-[inherit] bg-transparent placeholder:text-text-menu border-none text-text-secondary leading-[1.5rem] font-medium text-[0.875rem] focus:ring-transparent"
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
						{...(hasSuggestions
							? {
									role: 'combobox',
									'aria-autocomplete': 'list' as const,
									'aria-expanded': isListVisible,
									'aria-controls': isListVisible ? listId : undefined,
									'aria-activedescendant':
										highlightedSuggestion !== undefined
											? getSuggestionOptionId(listId, highlightedIndex)
											: undefined
							  }
							: {})}
					/>
				</div>
				{trailingContent ? (
					<div className="flex h-full shrink-0 items-center border-l border-border-primary px-1.5">
						{trailingContent}
					</div>
				) : null}
				{isListVisible ? (
					<BadgeSuggestionList
						id={listId}
						label={label}
						items={suggestionItems}
						checked={checkedSuggestions}
						total={filteredSuggestions.total}
						loading={suggestionsLoading}
						highlightedIndex={highlightedIndex}
						fieldRef={fieldRef}
						onHighlight={setHighlightedIndex}
						onToggle={handleToggleSuggestion}
						badgeClassName={badgeClassName}
						keyValueDisplayDelimiter={keyValueDisplayDelimiter}
						keyValueSubmitDelimiter={keyValueSubmitDelimiter}
					/>
				) : null}
			</div>
		);

		return (
			<BadgeInputContext.Provider value={contextValue}>
				{hasSuggestions ? (
					<Popover
						open={isListVisible}
						onOpenChange={(open) => {
							if (!open) closeList();
						}}
					>
						<PopoverAnchor asChild>{field}</PopoverAnchor>
					</Popover>
				) : (
					field
				)}
			</BadgeInputContext.Provider>
		);
	}
);
