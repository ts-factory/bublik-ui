/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useId, useMemo, useState, type RefObject } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	useGetIssuePickerQuery,
	useGetIssueQuery
} from '@/services/bublik-api';
import { Icon, InputLabel, cn, cva } from '@/shared/tailwind-ui';
import type { IssuePickerOption } from '@/shared/types';

import { formatBugKey } from './classification-colors';

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delayMs);

		return () => clearTimeout(id);
	}, [value, delayMs]);

	return debounced;
}

/**
 * Matches `TestPathComboboxField`'s input — the other autocomplete in the same
 * form, and the reason this one exists rather than the bare input it replaces.
 * Exported so `TrackerCombobox`, which sits two fields away in the classify
 * drawer, is the same input rather than a fourth copy of these classes.
 */
export const comboboxInputStyles = cva({
	base: [
		'w-full',
		'px-3.5',
		'py-[7px]',
		'outline-none',
		'border',
		'border-border-primary',
		'rounded',
		'text-text-secondary',
		'transition-all',
		'hover:border-primary',
		'disabled:text-text-menu',
		'disabled:cursor-not-allowed',
		// The page's own grey, the same one `Input` takes when disabled. A wash of
		// the primary colour read as *selected* rather than as *inert*.
		'disabled:bg-bg-body',
		'focus:border-primary',
		'focus:shadow-text-field',
		'active:shadow-none',
		'focus:ring-transparent',
		'placeholder:text-text-menu placeholder:font-normal',
		'leading-[1.5rem] font-medium text-[0.875rem]'
	]
});

/**
 * The short, human half of an issue's identity. `ref://E2E_BUGS/E2E-123` is a
 * URI, not a label — `formatBugKey` strips the scheme and tracker so the chip
 * reads `E2E-123`, which is what anyone actually recognises it by.
 */
function issueKeyLabel(option: Pick<IssuePickerOption, 'id' | 'key'>): string {
	return formatBugKey(option.key) ?? `#${option.id}`;
}

export interface IssuePickerProps {
	projectId?: number;
	value?: number | null;
	onChange: (id: number | null) => void;
	label?: string;
	placeholder?: string;
	/**
	 * Node to portal the popup into. Inside a modal drawer this must be an
	 * element within the dialog: a popup at `document.body` reads as a click
	 * outside, and selecting an option dismisses the drawer instead.
	 */
	container?: RefObject<HTMLElement>;
}

/**
 * Issue autocomplete, built on the same `Combobox` as the test path field so
 * the two behave and look alike where they sit side by side in the history
 * search form.
 *
 * The key and the title are separate elements in the list rather than one run
 * of text: concatenated, `ref://E2E_BUGS/E2E-123 ethtool reset regression`
 * gives the eye nothing to latch onto.
 */
export function IssuePicker({
	projectId,
	value,
	onChange,
	label,
	placeholder = 'Search issue by key or title…',
	container
}: IssuePickerProps) {
	const id = useId();
	const [inputValue, setInputValue] = useState('');
	const [open, setOpen] = useState(false);
	const search = useDebouncedValue(inputValue, 250);

	const { data, isFetching } = useGetIssuePickerQuery({
		projectId,
		search: search || undefined
	});

	// The selection can arrive from a deep link, where it is an id and nothing
	// more. Resolving it is what turns `?issue=42` into something readable.
	const { data: selectedIssue } = useGetIssueQuery(
		value != null ? { issueId: value, projectId } : skipToken
	);

	const options = useMemo(() => data ?? [], [data]);

	useEffect(() => {
		if (value == null) return;
		if (!selectedIssue) return;

		setInputValue(selectedIssue.title);
	}, [value, selectedIssue]);

	function handleSelect(option: IssuePickerOption | null) {
		if (!option) return;

		setInputValue(option.title);
		onChange(option.id);
	}

	function handleClear() {
		setInputValue('');
		onChange(null);
	}

	const selectedKey =
		value != null
			? issueKeyLabel({ id: value, key: selectedIssue?.issue_ext?.key ?? null })
			: null;

	return (
		<Combobox.Root
			items={options}
			inputValue={inputValue}
			open={open}
			onOpenChange={setOpen}
			onInputValueChange={(next, eventDetails) => {
				if (eventDetails.reason !== 'input-change') return;

				setInputValue(next);
				setOpen(true);
			}}
			onValueChange={(option) =>
				handleSelect(option as IssuePickerOption | null)
			}
			// Filtering is the server's job here — the endpoint searches title and
			// key together, over every issue rather than the page in hand.
			filter={null}
			itemToStringLabel={(item: IssuePickerOption) => item.title}
		>
			<div className="relative">
				{label ? (
					<InputLabel
						className="absolute top-[-11px] left-2 z-10 bg-white"
						htmlFor={id}
					>
						{label}
					</InputLabel>
				) : null}
				<div className="relative w-full">
					<Combobox.Input
						id={id}
						placeholder={placeholder}
						className={cn(
							comboboxInputStyles(),
							selectedKey ? 'pr-20' : 'pr-10'
						)}
						data-testid="issue-picker-input"
					/>
					<div className="absolute flex items-center gap-1 -translate-y-1/2 right-2 top-1/2">
						{selectedKey ? (
							<span className="px-1.5 rounded bg-badge-0 text-[0.6875rem] leading-[1.125rem] text-text-menu">
								{selectedKey}
							</span>
						) : null}
						{value != null ? (
							<button
								type="button"
								onClick={handleClear}
								aria-label="Clear issue"
								className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
								data-testid="issue-picker-clear"
							>
								<Icon name="CrossSimple" size={12} />
							</button>
						) : null}
						<Combobox.Trigger
							className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
							aria-label="Open issue list"
						>
							<Icon name="ArrowShortTop" size={20} className="rotate-180" />
						</Combobox.Trigger>
					</div>
				</div>
			</div>

			<Combobox.Portal container={container}>
				<Combobox.Positioner sideOffset={4} className="z-[60] outline-none">
					<Combobox.Popup
						className={cn(
							'bg-white rounded shadow-popover',
							'w-[var(--anchor-width)] max-w-[var(--available-width)]',
							'max-h-[min(var(--available-height),15rem)] overflow-hidden'
						)}
						data-testid="issue-picker-popup"
					>
						<Combobox.Empty>
							<div className="py-3 px-3.5 text-xs text-text-menu">
								{isFetching
									? 'Searching…'
									: search
									? 'No matches'
									: 'No issues yet — classify a result to create one'}
							</div>
						</Combobox.Empty>
						<Combobox.List className="overflow-y-auto overflow-x-hidden overscroll-contain py-1 max-h-[min(var(--available-height),15rem)]">
							{(item: IssuePickerOption) => (
								<Combobox.Item
									key={item.id}
									value={item}
									className={cn(
										'flex min-w-0 w-full overflow-hidden items-center gap-2 py-2 px-3.5 text-sm cursor-default',
										'select-none outline-none text-text-secondary',
										'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
									)}
									data-testid="issue-picker-option"
									data-issue-id={item.id}
									data-selected={value === item.id ? 'true' : 'false'}
								>
									{/* A common minimum width, so `#20` and `E2E-114` occupy
									    the same space and every title starts on the same
									    vertical line. Left-aligned within it — the keys read
									    as a column of their own, and centring made short ones
									    drift away from that edge. */}
									<span className="px-1.5 shrink-0 min-w-[4.5rem] text-left rounded bg-badge-0 text-[0.6875rem] leading-[1.125rem] text-text-menu">
										{issueKeyLabel(item)}
									</span>
									<span
										className="flex-1 min-w-0 text-xs truncate"
										title={item.title}
									>
										{item.title}
									</span>
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}
