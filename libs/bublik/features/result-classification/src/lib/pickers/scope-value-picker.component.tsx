/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId, useRef, useState, type RefObject } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { PopoverPortal } from '@radix-ui/react-popover';

import {
	Badge,
	BadgeVariants,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	FLOATING_LABEL_BACKDROP_CLASS,
	Icon,
	IconButton,
	InputLabel,
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
	Skeleton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import type { ScopeOption } from '../rule-form/match-scope.utils';
import { comboboxInputStyles } from './pickers.styles';

export interface ScopeValueStyle {
	variant: BadgeVariants;
	className?: string;
}

export interface ScopeValuePickerProps {
	label: string;
	/** What a rule does with the values, shown on the label. */
	hint: string;
	options: readonly ScopeOption[];
	value: readonly string[];
	onChange: (next: string[]) => void;
	/** The chip styling of a value, as the rules table shows it. */
	styleOf: (option: ScopeOption) => ScopeValueStyle;
	/** Why there is nothing to pick: the results or the run have none. */
	emptyText: string;
	loading?: boolean;
	container?: RefObject<HTMLElement>;
	testId?: string;
}

/**
 * A field of the match scope: the values a rule keeps show as chips, each
 * with its own remove button, and the list behind the field offers every
 * value the server would accept, so nothing is typed by hand and nothing the
 * results do not share can be picked.
 */
export function ScopeValuePicker({
	label,
	hint,
	options,
	value,
	onChange,
	styleOf,
	emptyText,
	loading = false,
	container,
	testId
}: ScopeValuePickerProps) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const fieldRef = useRef<HTMLDivElement>(null);
	const selected = new Set(value);
	const picked = options.filter((option) => selected.has(option.value));
	const disabled = loading || options.length === 0;

	function toggle(target: string) {
		// Kept in the list's order, whatever order the boxes were ticked in.
		onChange(
			options
				.filter((option) =>
					option.value === target
						? !selected.has(option.value)
						: selected.has(option.value)
				)
				.map((option) => option.value)
		);
	}

	function changeOpen(next: boolean) {
		setOpen(next);
		if (!next) setSearch('');
	}

	return (
		<Popover open={open} onOpenChange={changeOpen}>
			<PopoverAnchor asChild>
				<div className="relative" data-testid={testId}>
					<Tooltip content={hint}>
						<InputLabel
							className={cn(
								'absolute top-[-11px] left-2 z-10',
								FLOATING_LABEL_BACKDROP_CLASS
							)}
							htmlFor={id}
						>
							{label}
						</InputLabel>
					</Tooltip>
					{/* The History inputs' bin, on the border opposite the label. */}
					{!disabled ? (
						<div className="absolute -top-3 right-[9px] z-10 flex items-center bg-bg-primary px-1">
							<IconButton
								name="Bin"
								size={14}
								helpMessage={`Clear ${label.toLowerCase()}`}
								onClick={() => onChange([])}
								className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
							/>
						</div>
					) : null}
					{/* The whole field opens the list, around and between the chips
					    too, not only the trigger in what is left of the last row;
					    its own buttons keep their clicks. The keyboard has the
					    trigger. */}
					{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
					<div
						ref={fieldRef}
						onClick={(event) => {
							if (disabled) return;
							if ((event.target as HTMLElement).closest('button')) return;
							changeOpen(true);
						}}
						className={cn(
							comboboxInputStyles(),
							'relative flex min-h-[40px] flex-wrap items-center gap-1.5 pr-10',
							open && 'border-primary shadow-text-field',
							disabled ? 'bg-bg-body' : 'group/field cursor-pointer'
						)}
					>
						{loading ? (
							<>
								<Skeleton className="h-[1.375rem] w-20 rounded" />
								<Skeleton className="h-[1.375rem] w-28 rounded" />
							</>
						) : (
							picked.map((option) => {
								const style = styleOf(option);
								// Not a control, though the tooltip hands it an `onClick`: a
								// chip only reads, and its remove button is the control.
								return (
									<Badge
										key={option.value}
										as="span"
										isInteractive={false}
										variant={style.variant}
										className={cn(
											'flex items-center gap-1 text-xs',
											style.className
										)}
										overflowWrap
										data-testid="scope-value-chip"
										data-value={option.value}
									>
										<span>{option.label}</span>
										<button
											type="button"
											className="rounded text-text-menu hover:text-primary"
											onClick={() => toggle(option.value)}
											data-chip-remove
											aria-label={`Remove ${option.label}`}
										>
											<Icon name="CrossSimple" size={14} />
										</button>
									</Badge>
								);
							})
						)}
						<PopoverTrigger asChild>
							<button
								type="button"
								id={id}
								role="combobox"
								aria-expanded={open}
								aria-controls={`${id}-list`}
								aria-haspopup="listbox"
								disabled={disabled}
								className="min-w-[4rem] flex-1 self-stretch text-left text-[0.875rem] font-normal text-text-menu outline-none disabled:cursor-not-allowed"
								data-testid="scope-value-trigger"
							>
								{!loading && !picked.length
									? options.length
										? 'None kept: not matched on'
										: emptyText
									: null}
							</button>
						</PopoverTrigger>
						{/* The Issue field's arrow: a button of its own, washed on hover,
						    and on a hover anywhere in the field that a click would open
						    the list from, so not over a chip's remove button. The field
						    is the trigger for the keyboard, so this one is left out of
						    the tab order. */}
						<button
							type="button"
							tabIndex={-1}
							disabled={disabled}
							onClick={() => changeOpen(!open)}
							aria-label={`Open ${label.toLowerCase()} list`}
							className={cn(
								'absolute grid p-1 -translate-y-1/2 rounded right-2.5 top-1/2 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary disabled:pointer-events-none',
								'group-[:hover:not(:has([data-chip-remove]:hover))]/field:bg-primary-wash group-[:hover:not(:has([data-chip-remove]:hover))]/field:text-primary'
							)}
							data-testid="scope-value-arrow"
						>
							<Icon
								name="ArrowShortTop"
								className={cn(
									'size-[18px] transition-transform',
									open ? 'rotate-0' : 'rotate-180'
								)}
							/>
						</button>
					</div>
				</div>
			</PopoverAnchor>

			<PopoverPortal container={container?.current ?? undefined}>
				<PopoverContent
					className="z-[60] p-0 bg-bg-elevated rounded-lg shadow-popover w-[var(--radix-popover-trigger-width)]"
					align="start"
					sideOffset={4}
					onOpenAutoFocus={(event) => event.preventDefault()}
					// A press in the field is the field's to answer: closing here
					// first would have its click open the list straight back.
					onInteractOutside={(event) => {
						if (fieldRef.current?.contains(event.target as Node)) {
							event.preventDefault();
						}
					}}
					id={`${id}-list`}
					data-testid="scope-value-popup"
				>
					<Command>
						<CommandInput
							autoFocus
							placeholder={`Search ${label.toLowerCase()}…`}
							className="text-xs"
							value={search}
							onValueChange={setSearch}
							startIcon={
								<Icon
									name="MagnifyingGlass"
									size={18}
									className="opacity-50 shrink-0"
								/>
							}
						/>
						<CommandList className="max-h-72 overflow-y-auto">
							<CommandEmpty className="py-4 text-xs text-center">
								Not shared by the selected results.
							</CommandEmpty>
							{/* The values take the popup's width and wrap, since a parameter
							    can be long. */}
							<CommandGroup className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-[1.5rem_minmax(0,1fr)]">
								{options.map((option) => {
									const isSelected = selected.has(option.value);
									const style = styleOf(option);

									return (
										<CommandItem
											key={option.value}
											value={option.value}
											keywords={[option.label]}
											role="checkbox"
											aria-checked={isSelected}
											onSelect={() => toggle(option.value)}
											className="col-span-full grid grid-cols-subgrid items-center gap-x-3 px-0 data-[selected=true]:text-text-secondary"
											data-testid="scope-value-option"
											data-value={option.value}
											data-state={isSelected ? 'checked' : 'unchecked'}
										>
											<div
												className={cn(
													'ml-2 flex h-4 w-4 items-center justify-center rounded-sm border border-text-menu',
													isSelected
														? 'bg-primary text-white border-primary'
														: 'opacity-50 [&_svg]:invisible'
												)}
											>
												<CheckIcon className="h-4 w-4" />
											</div>
											<Badge
												variant={style.variant}
												className={cn(
													'justify-self-start text-xs',
													style.className
												)}
												overflowWrap
											>
												{option.label}
											</Badge>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</PopoverPortal>
		</Popover>
	);
}
