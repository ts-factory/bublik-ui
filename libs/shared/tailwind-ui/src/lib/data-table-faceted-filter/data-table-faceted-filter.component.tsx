/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { PopoverPortal } from '@radix-ui/react-popover';

import { cn } from '../utils';
import { Badge } from '../badge';
import { Popover, PopoverTrigger } from '../popover';
import { ButtonTw } from '../button';
import { Icon } from '../icon';
import { Separator } from '../separator';
import { PopoverContent } from '../popover';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from '../command';

/**
 * A rendered option — a badge — compacted to the height of the trigger's text
 * chips, and drawn the same in the list as in the trigger: a full-size badge
 * would crowd the button.
 */
const RENDER_CHIP_CLASS = 'flex [&>*]:py-0 [&>*]:px-1.5 [&>*]:leading-4';

export interface DataTableFacetedFilterProps {
	title?: string;
	options: {
		/** What the option is searched by, and shows unless it has `render`. */
		label: string;
		value: string;
		icon?: React.ReactNode;
		/**
		 * Shown instead of `label`, in the list and in the trigger — a badge, so
		 * the filter reads in the vocabulary of the cells it filters.
		 */
		render?: React.ReactNode;
		/** At the end of the option's row in the list, e.g. its count; not in the trigger. */
		detail?: React.ReactNode;
		/** More words the search matches, e.g. a long form of the label. */
		keywords?: string[];
	}[];
	onChange: (values: string[] | undefined) => void;
	value: string[];
	className?: string;
	size?: 'xss' | 'xs/2';
	disabled?: boolean;
	/**
	 * `single` turns the list into a radio group: picking an option replaces the
	 * selection instead of adding to it, picking the selected one clears it, and
	 * "Select all" goes away because it cannot mean anything.
	 *
	 * For filters the server compares against one raw value — a `;`-joined list
	 * matches no row — so offering a multi-select promises something the query
	 * cannot keep. `onChange` still carries an array, of zero or one entry, so
	 * callers and URL state are unchanged.
	 */
	selection?: 'multiple' | 'single';
}

export function DataTableFacetedFilter({
	title,
	options,
	value,
	onChange,
	size = 'xs/2',
	disabled = false,
	selection = 'multiple'
}: DataTableFacetedFilterProps) {
	const isSingle = selection === 'single';
	const selectedValues = new Set(value);
	const [isOpen, setIsOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState('');

	return (
		<Popover onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					size={size}
					variant="outline-secondary"
					state={isOpen && 'active'}
					disabled={disabled}
				>
					<Icon
						name="AddSymbol"
						size={16}
						className={cn(
							'mr-2 border rounded-full border-text-primary',
							disabled && 'border-text-menu'
						)}
					/>
					<span className="text-xs font-medium">{title}</span>
					{selectedValues?.size > 0 && (
						<>
							<Separator orientation="vertical" className="h-4 mx-2" />
							<div className="px-1 font-normal rounded-sm lg:hidden">
								{selectedValues.size}
							</div>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<div className="px-1 font-normal rounded-sm">
										{selectedValues.size} selected
									</div>
								) : (
									options
										.filter((option) => selectedValues.has(option.value))
										.map((option) =>
											option.render ? (
												<span key={option.value} className={RENDER_CHIP_CLASS}>
													{option.render}
												</span>
											) : (
												<Badge
													key={option.value}
													className="py-0 text-xs bg-primary-wash"
												>
													{option.label}
												</Badge>
											)
										)
								)}
							</div>
						</>
					)}
				</ButtonTw>
			</PopoverTrigger>
			<PopoverPortal>
				<PopoverContent
					className="p-0 bg-white rounded-lg shadow-popover"
					align="start"
					sideOffset={4}
				>
					<Command>
						<CommandInput
							placeholder={title}
							className="text-xs"
							value={inputValue}
							onValueChange={setInputValue}
							startIcon={
								<Icon
									name="MagnifyingGlass"
									size={18}
									className="opacity-50 shrink-0"
								/>
							}
							endIcon={
								<button
									className="p-1 rounded cursor-pointer text-text-menu hover:bg-primary-wash hover:text-primary"
									onClick={(_) => setInputValue('')}
								>
									<Icon name="Cross" size={12} />
								</button>
							}
						/>
						<CommandList className="max-h-96 overflow-y-auto">
							<CommandEmpty className="py-4 text-xs text-center">
								No results found.
							</CommandEmpty>
							<CommandGroup>
								{options.map((option) => {
									const isSelected = selectedValues.has(option.value);

									return (
										<CommandItem
											key={option.value}
											value={option.label}
											keywords={option.keywords}
											role={isSingle ? 'radio' : 'checkbox'}
											aria-checked={isSelected}
											onSelect={() => {
												if (isSingle) {
													onChange?.(isSelected ? [] : [option.value]);
													return;
												}

												if (isSelected) {
													selectedValues.delete(option.value);
												} else {
													selectedValues.add(option.value);
												}
												const filterValues = Array.from(selectedValues);

												onChange?.(filterValues.length ? filterValues : []);
											}}
										>
											<div
												className={cn(
													'mr-2 flex h-4 w-4 items-center justify-center border border-text-menu',
													// A circle reads as "one of these"; the square the
													// multi-select uses reads as "any of these".
													isSingle ? 'rounded-full' : 'rounded-sm',
													isSelected
														? 'bg-primary text-white border-primary'
														: 'opacity-50 [&_svg]:invisible'
												)}
											>
												{isSingle ? (
													<span className="w-1.5 h-1.5 bg-white rounded-full" />
												) : (
													<CheckIcon className={cn('h-4 w-4')} />
												)}
											</div>
											{option.icon && option.icon}
											{option.render ? (
												<span className={RENDER_CHIP_CLASS}>
													{option.render}
												</span>
											) : (
												<span className="text-xs">{option.label}</span>
											)}
											{option.detail !== undefined ? (
												<>
													{' '}
													<span className="pl-2 ml-auto text-xs tabular-nums text-text-menu">
														{option.detail}
													</span>
												</>
											) : null}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
						{selectedValues.size > 0 ? (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => onChange?.([])}
										className="justify-center text-xs text-center"
									>
										{isSingle ? 'Clear filter' : 'Clear filters'}
									</CommandItem>
								</CommandGroup>
							</>
						) : isSingle ? null : (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => onChange?.(options.map((v) => v.value))}
										className="justify-center text-xs text-center"
									>
										Select all
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</Command>
				</PopoverContent>
			</PopoverPortal>
		</Popover>
	);
}
