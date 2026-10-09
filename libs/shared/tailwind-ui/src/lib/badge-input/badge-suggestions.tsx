/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { RefObject, useEffect, useRef } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

import { formatKeyValueForDisplay } from '@/shared/utils';

import { BadgeClassName, resolveBadgeClassName } from './types';
import { PopoverContent } from '../popover';
import { cn } from '../utils';

interface BadgeSuggestionListProps {
	id: string;
	label?: string;
	items: readonly string[];
	/** The values already among the field's badges, shown ticked. */
	checked: ReadonlySet<string>;
	/** Every match, so the list can say how many more typing would reveal. */
	total: number;
	loading: boolean;
	highlightedIndex: number;
	/** The field: a press inside it is the field's to answer, not a dismissal. */
	fieldRef: RefObject<HTMLElement>;
	onHighlight: (index: number) => void;
	/** Ticks a value (adds its badge) or unticks it (removes it). */
	onToggle: (value: string) => void;
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
	/** The chips take the field's badge colours. */
	badgeClassName?: BadgeClassName;
}

function getSuggestionOptionId(listId: string, index: number): string {
	return `${listId}-option-${index}`;
}

/**
 * The values a badge field offers as the user types, in a list under the
 * field. It is rendered inside the field rather than portalled, so it stays
 * inside whatever dialog holds the field. Each row is a checkbox, ticked when
 * its value is already a badge, as in the classify drawer's pickers; a
 * highlighted row keeps its text colour, and long values wrap rather than
 * being cut at the field's width.
 */
function BadgeSuggestionList({
	id,
	label,
	items,
	checked,
	total,
	loading,
	highlightedIndex,
	fieldRef,
	onHighlight,
	onToggle,
	keyValueDisplayDelimiter,
	keyValueSubmitDelimiter,
	badgeClassName
}: BadgeSuggestionListProps) {
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (highlightedIndex < 0) return;

		const option = listRef.current?.children[highlightedIndex];

		option?.scrollIntoView?.({ block: 'nearest' });
	}, [highlightedIndex]);

	const isInsideField = (target: EventTarget | null) =>
		target instanceof Node && Boolean(fieldRef.current?.contains(target));

	return (
		<PopoverContent
			className="z-[60] p-0 bg-white rounded-lg shadow-popover w-[var(--radix-popover-trigger-width)]"
			align="start"
			sideOffset={4}
			onOpenAutoFocus={(event) => event.preventDefault()}
			onCloseAutoFocus={(event) => event.preventDefault()}
			onInteractOutside={(event) => {
				if (isInsideField(event.target)) event.preventDefault();
			}}
			data-testid="tw-badge-input-suggestions"
		>
			{loading && !items.length ? (
				<div className="py-4 text-xs text-center text-text-menu">
					Loading suggestions…
				</div>
			) : null}
			{items.length ? (
				<ul
					id={id}
					ref={listRef}
					role="listbox"
					aria-multiselectable
					aria-label={label ? `${label} suggestions` : 'Suggestions'}
					className="max-h-72 overflow-y-auto p-1"
				>
					{items.map((item, index) => {
						const isChecked = checked.has(item);

						return (
							<li
								key={item}
								id={getSuggestionOptionId(id, index)}
								role="option"
								aria-selected={isChecked}
								// Keeps the focus in the field's input, so ticking does not
								// blur the field and close the list under the pointer.
								onMouseDown={(event) => event.preventDefault()}
								onMouseMove={() => {
									if (index !== highlightedIndex) onHighlight(index);
								}}
								onClick={() => onToggle(item)}
								className={cn(
									'flex cursor-default select-none items-center gap-3 rounded-md px-2 py-1.5 text-sm',
									index === highlightedIndex && 'bg-primary-wash'
								)}
								data-testid="tw-badge-input-suggestion"
								data-value={item}
								data-state={isChecked ? 'checked' : 'unchecked'}
								data-highlighted={index === highlightedIndex || undefined}
							>
								<div
									className={cn(
										'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-text-menu',
										isChecked
											? 'bg-primary text-white border-primary'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<CheckIcon className="h-4 w-4" />
								</div>
								<span
									className={cn(
										'inline-flex min-w-0 items-center py-0.5 px-2 rounded border border-transparent bg-badge-0 text-xs font-medium leading-[1.125rem] text-text-secondary [overflow-wrap:anywhere]',
										resolveBadgeClassName(badgeClassName, item)
									)}
								>
									{formatKeyValueForDisplay(item, {
										displayDelimiter: keyValueDisplayDelimiter,
										submitDelimiter: keyValueSubmitDelimiter
									})}
								</span>
							</li>
						);
					})}
				</ul>
			) : null}
			{total > items.length ? (
				<div className="px-3 pt-1 pb-2 text-xs text-text-menu border-t border-border-primary">
					{total - items.length} more: keep typing to narrow the list
				</div>
			) : null}
		</PopoverContent>
	);
}

export { BadgeSuggestionList, getSuggestionOptionId };
export type { BadgeSuggestionListProps };
