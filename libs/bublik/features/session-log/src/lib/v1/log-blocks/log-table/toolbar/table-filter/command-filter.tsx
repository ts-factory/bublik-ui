/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

import {
	Badge,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	cn,
	ButtonTw
} from '@/shared/tailwind-ui';

export interface DataTableFacetedFilterProps {
	title?: string;
	options: {
		label: string;
		value: string;
		icon?: React.ReactNode;
	}[];
	onChange: (values: string[] | undefined) => void;
	value: string[];
	className?: string;
}

export function DataTableFacetedFilter({
	title,
	options,
	value,
	onChange,
	className
}: DataTableFacetedFilterProps) {
	const selectedValues = new Set(value);
	const [isOpen, setIsOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState('');

	return (
		<Popover onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					size="xs/2"
					variant="outline-secondary"
					state={isOpen && 'active'}
				>
					<Icon
						name="AddSymbol"
						size={16}
						className="mr-2 border rounded-full border-text-primary"
					/>
					<span className="text-xs">{title}</span>
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
										.map((option) => (
											<Badge
												key={option.value}
												className="py-0 text-xs bg-primary-wash"
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</ButtonTw>
			</PopoverTrigger>
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
					<CommandList>
						<CommandEmpty className="py-4 text-xs text-center">
							No results found.
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);

								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
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
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-text-menu',
												isSelected
													? 'bg-primary text-white border-primary'
													: 'opacity-50 [&_svg]:invisible'
											)}
										>
											<CheckIcon className={cn('h-4 w-4')} />
										</div>
										{option.icon && option.icon}
										<span className="text-xs">{option.label}</span>
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
									Clear filters
								</CommandItem>
							</CommandGroup>
						</>
					) : (
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
		</Popover>
	);
}
