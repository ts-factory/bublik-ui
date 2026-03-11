/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	KeyboardEvent,
	MouseEvent,
	ReactNode,
	useMemo,
	useRef,
	useState
} from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

import { Badge } from '../badge';
import { ButtonTw } from '../button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from '../command';
import { Icon } from '../icon';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Separator } from '../separator';
import { cn, cva } from '../utils';

export type BoxValue = {
	label: string;
	value: string;
	isSelected?: boolean;
	className?: string;
	groupLabel?: string;
};

const normalizeInputValue = (value: string) =>
	value.trim().replace(/\s+/g, ' ');

const normalizeForMatch = (value: string) =>
	normalizeInputValue(value).toLowerCase();

const updateSelection = <T extends BoxValue>(
	values: T[],
	targetValue: string,
	isSelected: boolean
): T[] =>
	values.map((box) =>
		box.value === targetValue ? ({ ...box, isSelected } as T) : box
	);

const clearSelection = <T extends BoxValue>(values: T[]): T[] =>
	values.map((box) =>
		box.isSelected ? ({ ...box, isSelected: false } as T) : box
	);

const triggerLabelStyles = cva({
	variants: {
		size: {
			xss: 'text-xs font-medium',
			'xs/2': 'text-xs font-medium',
			md: 'text-[0.875rem] font-medium leading-[1.5rem]'
		}
	}
});

const triggerSummaryStyles = cva({
	variants: {
		size: {
			xss: 'text-xs font-normal',
			'xs/2': 'text-xs font-normal',
			md: 'text-[0.875rem] font-normal leading-[1.5rem]'
		}
	}
});

const triggerBadgeStyles = cva({
	variants: {
		size: {
			xss: 'text-xs leading-4',
			'xs/2': 'text-xs leading-4',
			md: 'text-xs leading-4'
		}
	}
});

export interface FancyBoxProps {
	/** Label of the component */
	label: string;
	/** Default list of tags */
	values: BoxValue[];
	/** Handler on changed */
	onChange?: (boxes: BoxValue[]) => void;
	/** This is for labelling single item e.g. "Tag" */
	valueLabel?: string;
	/** Placeholder for input */
	placeholder?: string;
	/** Start icon for trigger button */
	startIcon?: ReactNode;
	/** End icon for trigger button */
	endIcon?: ReactNode;
	/** Button size */
	size?: 'xss' | 'xs/2' | 'md';
	/** Group label for newly created values */
	createdGroupLabel?: string;
	/** Order for rendering grouped sections */
	groupOrder?: readonly string[];
}

/**
 * Tags box input is a button with combobox popover for selecting and creating tags.
 */
export const TagsBoxInput = ({
	label,
	endIcon,
	startIcon,
	placeholder,
	valueLabel,
	values,
	onChange,
	size = 'md',
	createdGroupLabel,
	groupOrder
}: FancyBoxProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [openCombobox, setOpenCombobox] = useState(false);
	const [inputValue, setInputValue] = useState('');

	const selectedValues = useMemo(
		() => values.filter((box) => box.isSelected),
		[values]
	);
	const groupedValues = useMemo(() => {
		const groups = values.reduce<Map<string | undefined, BoxValue[]>>(
			(acc, box) => {
				const groupLabel = box.groupLabel;
				const current = acc.get(groupLabel) || [];

				acc.set(groupLabel, [...current, box]);
				return acc;
			},
			new Map()
		);

		return Array.from(groups.entries()).sort(([left], [right]) => {
			if (groupOrder?.length) {
				const leftIndex =
					left === undefined ? groupOrder.length : groupOrder.indexOf(left);
				const rightIndex =
					right === undefined ? groupOrder.length : groupOrder.indexOf(right);
				const normalizedLeft =
					leftIndex === -1 ? groupOrder.length + 1 : leftIndex;
				const normalizedRight =
					rightIndex === -1 ? groupOrder.length + 1 : rightIndex;

				return normalizedLeft - normalizedRight;
			}

			if (left === undefined) return 1;
			if (right === undefined) return -1;
			return 0;
		});
	}, [groupOrder, values]);
	const normalizedInputValue = normalizeInputValue(inputValue);
	const normalizedValueLabel = (valueLabel || label).toLowerCase();
	const hasNormalizedMatch = values.some(
		(box) =>
			normalizeForMatch(box.value) ===
				normalizeForMatch(normalizedInputValue) ||
			normalizeForMatch(box.label) === normalizeForMatch(normalizedInputValue)
	);
	const canCreate = normalizedInputValue.length > 0 && !hasNormalizedMatch;

	const focusInput = () => queueMicrotask(() => inputRef.current?.focus());

	const handleOpenChange = (isOpen: boolean) => {
		setOpenCombobox(isOpen);
		if (isOpen) focusInput();
	};

	const handleChange = (nextValues: BoxValue[]) => {
		onChange?.(nextValues);
	};

	const handleToggle = (box: BoxValue) => {
		handleChange(updateSelection(values, box.value, !box.isSelected));
		focusInput();
	};

	const handleRemove = (box: BoxValue) => {
		handleChange(updateSelection(values, box.value, false));
		focusInput();
	};

	const handleCreate = () => {
		if (!canCreate) return;

		handleChange([
			...values,
			{
				value: normalizedInputValue,
				label: normalizedInputValue,
				isSelected: true,
				groupLabel: createdGroupLabel || valueLabel || label
			}
		]);
		setInputValue('');
		focusInput();
	};

	const handleClearSelection = () => {
		handleChange(clearSelection(values));
		focusInput();
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && canCreate) {
			event.preventDefault();
			handleCreate();
			return;
		}

		if (event.key !== 'Backspace' || inputValue.length > 0) return;

		const lastValue = selectedValues.at(-1);

		if (!lastValue) return;

		event.preventDefault();
		setInputValue(lastValue.label);
		handleRemove(lastValue);
	};

	const keepPopoverOpen = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
	};

	return (
		<Popover open={openCombobox} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="outline-secondary"
					size={size}
					state={openCombobox ? 'active' : 'default'}
					className={cn(
						'max-w-[26rem] justify-start',
						size !== 'xss' && 'gap-0'
					)}
					// eslint-disable-next-line jsx-a11y/role-has-required-aria-props
					role="combobox"
					aria-expanded={openCombobox}
				>
					{startIcon ? (
						<span className="mr-2 shrink-0 text-text-menu">{startIcon}</span>
					) : null}
					<span className={cn('truncate', triggerLabelStyles({ size }))}>
						{label}
					</span>
					{selectedValues.length > 0 ? (
						<>
							<Separator orientation="vertical" className="mx-2 h-4 shrink-0" />
							<div className="flex min-w-0 items-center gap-1 overflow-hidden">
								{selectedValues.length > 2 ? (
									<span
										className={cn('truncate', triggerSummaryStyles({ size }))}
									>
										{selectedValues.length} selected
									</span>
								) : (
									selectedValues.map((box) => (
										<Badge
											key={box.value}
											className={cn(
												'max-w-[8rem] truncate bg-primary-wash px-1.5 py-0',
												triggerBadgeStyles({ size }),
												box.className
											)}
										>
											<span className="truncate">{box.label}</span>
										</Badge>
									))
								)}
							</div>
						</>
					) : null}
					<span className="ml-2 shrink-0 text-text-menu">
						{endIcon || <Icon name="ArrowShortSmall" />}
					</span>
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				sideOffset={4}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputRef.current?.focus();
				}}
				className="w-[24rem] max-w-[calc(100vw-2rem)] rounded-lg bg-white p-0 shadow-popover"
			>
				<Command loop>
					<CommandInput
						ref={inputRef}
						placeholder={placeholder || label}
						className="text-xs"
						value={inputValue}
						onValueChange={setInputValue}
						onKeyDown={handleInputKeyDown}
						startIcon={
							<Icon
								name="MagnifyingGlass"
								size={18}
								className="shrink-0 opacity-50"
							/>
						}
						endIcon={
							normalizedInputValue ? (
								<button
									type="button"
									className="rounded p-1 text-text-menu hover:bg-primary-wash hover:text-primary"
									onMouseDown={keepPopoverOpen}
									onClick={() => {
										setInputValue('');
										focusInput();
									}}
									aria-label="Clear search"
								>
									<Icon name="Cross" size={12} />
								</button>
							) : null
						}
					/>
					{selectedValues.length > 0 ? (
						<div className="flex flex-wrap gap-1 border-b border-border-primary bg-primary-wash px-3 py-2">
							{selectedValues.map((box) => (
								<Badge
									key={box.value}
									className={cn(
										'flex items-center gap-1 bg-badge-10 px-1.5 py-0 text-xs leading-4',
										box.className
									)}
								>
									<span>{box.label}</span>
									<button
										type="button"
										className="rounded text-text-menu hover:text-primary"
										onMouseDown={keepPopoverOpen}
										onClick={() => handleRemove(box)}
										aria-label={`Remove ${box.label}`}
									>
										<Icon name="CrossSimple" size={14} />
									</button>
								</Badge>
							))}
						</div>
					) : null}
					<CommandList className="max-h-96 overflow-y-auto">
						<CommandEmpty className="py-4 text-center text-xs">
							No results found.
						</CommandEmpty>
						{groupedValues.map(([groupLabel, groupValues], index) => (
							<CommandGroup
								key={groupLabel || `group-${index}`}
								heading={groupLabel}
								className={cn(
									'pt-0 [&_[cmdk-group-heading]]:-mx-1 [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:border-y [&_[cmdk-group-heading]]:border-border-primary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2',
									index === 0 && '[&_[cmdk-group-heading]]:border-t-0'
								)}
							>
								{groupValues.map((box) => {
									const isSelected = Boolean(box.isSelected);

									return (
										<CommandItem
											key={box.value}
											value={`${box.label} ${box.value} ${groupLabel}`.trim()}
											onSelect={() => handleToggle(box)}
											className="gap-2 text-xs data-[selected=true]:text-text-primary"
										>
											<div
												className={cn(
													'mr-0 flex h-4 w-4 items-center justify-center rounded-sm border border-text-menu',
													isSelected
														? 'border-primary bg-primary text-white'
														: 'opacity-50 [&_svg]:invisible'
												)}
											>
												<CheckIcon className="h-4 w-4" />
											</div>
											<Badge
												className={cn(
													'max-w-[18rem] truncate bg-badge-10 text-xs',
													box.className
												)}
											>
												{box.label}
											</Badge>
										</CommandItem>
									);
								})}
							</CommandGroup>
						))}
						{canCreate ? (
							<CommandGroup
								heading="Create"
								className="pt-0 [&_[cmdk-group-heading]]:-mx-1 [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:border-y [&_[cmdk-group-heading]]:border-border-primary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
							>
								<CommandItem
									value={inputValue}
									onSelect={handleCreate}
									className="min-h-[38px] gap-2 text-xs text-text-secondary data-[selected=true]:text-text-secondary"
								>
									<div className="mr-0 flex h-4 w-4 items-center justify-center rounded-sm border border-border-primary text-primary">
										<Icon name="AddSymbol" size={10} />
									</div>
									Create new {normalizedValueLabel} &quot;{normalizedInputValue}
									&quot;
								</CommandItem>
							</CommandGroup>
						) : null}
					</CommandList>
					{selectedValues.length > 0 ? (
						<>
							<CommandSeparator />
							<CommandGroup>
								<CommandItem
									onSelect={handleClearSelection}
									className="justify-center text-center text-xs"
								>
									Clear selection
								</CommandItem>
							</CommandGroup>
						</>
					) : null}
				</Command>
			</PopoverContent>
		</Popover>
	);
};
