/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type RefObject
} from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	useGetIssuePickerQuery,
	useGetIssueQuery,
	useGetIssueSearchOptionsQuery
} from '@/services/bublik-api';
import {
	FLOATING_LABEL_BACKDROP_CLASS,
	Icon,
	InputLabel,
	cn
} from '@/shared/tailwind-ui';
import type { IssuePickerOption } from '@/shared/types';

import { BugKeyChip } from '../classification/classification-badges.component';
import { comboboxInputStyles } from './pickers.styles';
import { PICKER_SEARCH_DEBOUNCE_MS, useDebouncedValue } from './pickers.hooks';

/**
 * What an option needs, common to both sources: `/issues/picker/` answers a full
 * `IssuePickerOption`, `/history/issue_search_options/` only these three.
 */
type PickerItem = Pick<IssuePickerOption, 'id' | 'title' | 'bug_key'> &
	Partial<Pick<IssuePickerOption, 'state'>>;

export interface IssuePickerProps {
	projectId?: number;
	value?: number | null;
	onChange: (id: number | null) => void;
	label?: string;
	placeholder?: string;
	container?: RefObject<HTMLElement>;
	/**
	 * Scope the options to the issues that classify at least one result of this
	 * test, via `/history/issue_search_options/`. Without it the picker offers
	 * every issue in the project, which on a filter form means most choices
	 * return nothing. Filtering happens client-side here: unlike the project
	 * picker, that endpoint takes no `search` term and returns one list.
	 */
	testName?: string | null;
	/** Shows the chosen issue without letting it change or be cleared. */
	disabled?: boolean;
}

export function IssuePicker({
	projectId,
	value,
	onChange,
	label,
	placeholder = 'Search issue by key or title…',
	container,
	testName,
	disabled = false
}: IssuePickerProps) {
	const id = useId();
	const [inputValue, setInputValue] = useState('');
	const [open, setOpen] = useState(false);
	const search = useDebouncedValue(inputValue, PICKER_SEARCH_DEBOUNCE_MS);

	const scoped = Boolean(testName);

	const { data, isFetching } = useGetIssuePickerQuery(
		scoped ? skipToken : { projectId, search: search || undefined }
	);

	const { data: scopedData, isFetching: isScopedFetching } =
		useGetIssueSearchOptionsQuery(
			scoped ? { testName: testName as string, project: projectId } : skipToken
		);

	const { data: selectedIssue } = useGetIssueQuery(
		value != null ? { issueId: value, projectId } : skipToken
	);

	const options = useMemo<PickerItem[]>(() => {
		if (!scoped) return data ?? [];

		const term = search.trim().toLowerCase();

		return (scopedData ?? []).filter(
			(option) =>
				!term ||
				option.title.toLowerCase().includes(term) ||
				(option.bug_key ?? '').toLowerCase().includes(term)
		);
	}, [scoped, data, scopedData, search]);

	useEffect(() => {
		if (value == null) return;
		if (!selectedIssue) return;

		setInputValue(selectedIssue.title);
	}, [value, selectedIssue]);

	function handleSelect(option: PickerItem | null) {
		if (!option) return;

		setInputValue(option.title);
		onChange(option.id);
	}

	function handleClear() {
		setInputValue('');
		onChange(null);
	}

	// The key chip and the buttons sit over the input's right edge; the padding
	// follows their width so a long key never covers the title.
	const adornmentRef = useRef<HTMLDivElement>(null);
	const [adornmentWidth, setAdornmentWidth] = useState(0);

	useLayoutEffect(() => {
		const adornment = adornmentRef.current;

		if (!adornment) return;

		const observer = new ResizeObserver(() =>
			setAdornmentWidth(adornment.offsetWidth)
		);

		observer.observe(adornment);

		return () => observer.disconnect();
	}, []);

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
			onValueChange={(option) => handleSelect(option as PickerItem | null)}
			filter={null}
			itemToStringLabel={(item: PickerItem) => item.title}
			disabled={disabled}
		>
			<div className="relative">
				{label ? (
					<InputLabel
						className={cn(
							'absolute top-[-11px] left-2 z-10',
							FLOATING_LABEL_BACKDROP_CLASS,
							disabled && 'text-text-menu'
						)}
						htmlFor={id}
					>
						{label}
					</InputLabel>
				) : null}
				<div className="relative w-full">
					<Combobox.Input
						id={id}
						placeholder={placeholder}
						className={comboboxInputStyles()}
						style={{ paddingRight: adornmentWidth + 16 }}
						data-testid="issue-picker-input"
					/>
					<div
						ref={adornmentRef}
						className="absolute flex items-center gap-1 -translate-y-1/2 right-2.5 top-1/2"
					>
						{value != null ? (
							<BugKeyChip
								bugKey={selectedIssue?.bug_key ?? null}
								fallback={`#${value}`}
								closed={selectedIssue?.state === 'closed'}
							/>
						) : null}
						{value != null && !disabled ? (
							<button
								type="button"
								onClick={handleClear}
								aria-label="Clear issue"
								className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
								data-testid="issue-picker-clear"
							>
								<Icon name="CrossSimple" size={20} />
							</button>
						) : null}
						<Combobox.Trigger
							className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary data-[disabled]:pointer-events-none"
							aria-label="Open issue list"
						>
							<Icon name="ArrowShortTop" className="rotate-180 size-[18px]" />
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
								{isFetching || isScopedFetching
									? 'Searching…'
									: search
									? 'No matches'
									: scoped
									? 'No issue classifies a result of this test yet'
									: 'No issues yet — classify a result to create one'}
							</div>
						</Combobox.Empty>
						{/* One grid for every row: the key column is as wide as the
						    widest key listed, so the titles start on one line. */}
						<Combobox.List className="grid grid-cols-[max-content_minmax(0,1fr)] overflow-y-auto overflow-x-hidden overscroll-contain py-1 max-h-[min(var(--available-height),15rem)]">
							{(item: PickerItem) => (
								<Combobox.Item
									key={item.id}
									value={item}
									className={cn(
										'col-span-full grid grid-cols-subgrid min-w-0 items-center gap-x-2 py-2 px-3.5 text-sm cursor-default',
										'select-none outline-none text-text-secondary',
										'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
									)}
									data-testid="issue-picker-option"
									data-issue-id={item.id}
									data-selected={value === item.id ? 'true' : 'false'}
								>
									<BugKeyChip
										bugKey={item.bug_key}
										fallback={`#${item.id}`}
										closed={item.state === 'closed'}
										className="justify-self-start"
									/>
									<span className="min-w-0 text-xs truncate" title={item.title}>
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
