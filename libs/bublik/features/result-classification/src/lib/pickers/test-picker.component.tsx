/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useId, useMemo, useState, type RefObject } from 'react';
import { Combobox } from '@base-ui/react/combobox';

import { ErrorMessage, Icon, InputLabel, cn } from '@/shared/tailwind-ui';
import type { TestOption } from '@/shared/types';

import { comboboxInputStyles } from './issue-picker.container';

export interface TestPickerProps {
	options: TestOption[];
	value?: number | null;
	onChange: (id: number | null) => void;
	/** The name for a `value` the options do not contain — see `TestPicker`. */
	valueName?: string | null;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	isLoading?: boolean;
	error?: string;
	/** Portal target — see `IssuePickerProps.container` for why this matters. */
	container?: RefObject<HTMLElement>;
}

/**
 * Test autocomplete, the same `Combobox` as `IssuePicker` so the two fields
 * sitting one above the other in the rule drawer behave alike.
 *
 * Unlike `IssuePicker` it does **not** own its query: there is no test-picker
 * endpoint, so the options are assembled by `useKnownTests` from the rules that
 * already exist. Filtering is therefore local — the whole set is in hand.
 *
 * `valueName` covers the case the option list cannot: editing a rule whose test
 * is not in the list (a project narrowing, a very long tail). The field still
 * shows what the rule points at rather than going blank and implying the value
 * was lost.
 */
export function TestPicker({
	options,
	value,
	onChange,
	valueName,
	label = 'Test',
	placeholder = 'Search test by name…',
	disabled = false,
	isLoading = false,
	error,
	container
}: TestPickerProps) {
	const id = useId();
	const [inputValue, setInputValue] = useState('');
	const [open, setOpen] = useState(false);

	const selected = useMemo(
		() => options.find((option) => option.id === value) ?? null,
		[options, value]
	);
	const selectedName = selected?.name ?? valueName ?? null;

	// Track the selection rather than mirror it on every render: typing has to
	// be able to diverge from the chosen value, or the field cannot be searched.
	useEffect(() => {
		if (value == null) return;
		if (!selectedName) return;

		setInputValue(selectedName);
	}, [value, selectedName]);

	function handleClear() {
		setInputValue('');
		onChange(null);
	}

	const emptyMessage = isLoading
		? 'Loading tests…'
		: options.length
		? 'No matches'
		: // Worth naming the reason: an empty list here is not "no tests exist",
		  // it is "nothing has told this page a test id yet". See `useKnownTests`.
		  'No tests available — a test becomes selectable once it has at least one rule';

	return (
		<div className="flex flex-col gap-1">
			<Combobox.Root
				items={options}
				inputValue={inputValue}
				open={open}
				disabled={disabled}
				onOpenChange={setOpen}
				onInputValueChange={(next, eventDetails) => {
					if (eventDetails.reason !== 'input-change') return;

					setInputValue(next);
					setOpen(true);
				}}
				onValueChange={(option) => {
					const picked = option as TestOption | null;

					if (!picked) return;

					setInputValue(picked.name);
					onChange(picked.id);
				}}
				itemToStringLabel={(item: TestOption) => item.name}
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
								'pr-16',
								disabled && 'bg-bg-body',
								error &&
									'border-bg-error hover:border-bg-error focus:border-bg-error'
							)}
							data-testid="test-picker-input"
						/>
						<div className="absolute flex items-center gap-1 -translate-y-1/2 right-2 top-1/2">
							{value != null && !disabled ? (
								<button
									type="button"
									onClick={handleClear}
									aria-label="Clear test"
									className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
									data-testid="test-picker-clear"
								>
									<Icon name="CrossSimple" size={12} />
								</button>
							) : null}
							{disabled ? null : (
								<Combobox.Trigger
									className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
									aria-label="Open test list"
								>
									<Icon name="ArrowShortTop" size={20} className="rotate-180" />
								</Combobox.Trigger>
							)}
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
							data-testid="test-picker-popup"
						>
							<Combobox.Empty>
								<div className="py-3 px-3.5 text-xs text-text-menu">
									{emptyMessage}
								</div>
							</Combobox.Empty>
							<Combobox.List className="overflow-y-auto overflow-x-hidden overscroll-contain py-1 max-h-[min(var(--available-height),15rem)]">
								{(item: TestOption) => (
									<Combobox.Item
										key={item.id}
										value={item}
										className={cn(
											'flex min-w-0 w-full overflow-hidden items-center py-2 px-3.5 text-sm cursor-default',
											'select-none outline-none text-text-secondary',
											'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
										)}
										data-testid="test-picker-option"
										data-test-id-value={item.id}
									>
										{/* A test path is one unbroken token, so it truncates
										    rather than wraps — the title attribute carries the
										    rest, the way the rules table's Test column does. */}
										<span
											className="flex-1 min-w-0 text-xs truncate"
											title={item.name}
										>
											{item.name}
										</span>
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>
			{error ? <ErrorMessage>{error}</ErrorMessage> : null}
		</div>
	);
}
