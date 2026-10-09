/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, type ReactNode } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';

import { Icon } from '../icon';
import { FLOATING_LABEL_BACKDROP_CLASS, InputLabel } from '../input-label';
import { cn } from '../utils';

export type SelectItemFieldProps = SelectPrimitive.SelectItemProps & {
	render?: ReactNode;
	description?: ReactNode;
};

const SelectItemField = ({
	render,
	description,
	...props
}: SelectItemFieldProps) => {
	const text = (
		<SelectItemText>
			{render ?? (props.textValue || props.value)}
		</SelectItemText>
	);

	return (
		<SelectItem
			{...props}
			className={cn(
				'relative rounded justify-between gap-3 focus:bg-primary-wash text-xs font-medium text-text-secondary flex items-center h-12 py-3.5 px-3.5 outline-none rdx-state-active:text-primary hover:bg-primary-wash',
				// A row of the viewport's grid, so every description starts
				// past the widest value.
				description !== undefined &&
					'col-span-full grid grid-cols-subgrid justify-normal'
			)}
		>
			{text}
			{description !== undefined ? (
				// Outside `ItemText`, so the trigger shows only the value.
				<span className="min-w-0 truncate text-[0.6875rem] font-medium text-text-menu">
					{description}
				</span>
			) : null}
			<SelectPrimitive.ItemIndicator>
				<CheckIcon width={20} height={20} />
			</SelectPrimitive.ItemIndicator>
		</SelectItem>
	);
};

export type SelectValue = {
	value: string;
	displayValue?: string;
	/**
	 * What the option shows, in the list and in the trigger once picked —
	 * `displayValue` then only feeds typeahead.
	 */
	render?: ReactNode;
	/** One line of help beside the option in the list; the trigger leaves it out. */
	description?: ReactNode;
};

export interface SelectProps extends SelectPrimitive.SelectProps {
	label: string;
	options: SelectValue[];
	placeholder?: string;
}

export const SelectInput = forwardRef<HTMLButtonElement, SelectProps>(
	({ label, options, defaultValue, placeholder, ...props }, ref) => {
		const described = options.some(
			(option) => option.description !== undefined
		);

		return (
			<div className="relative flex w-full min-w-[240px]">
				<InputLabel
					className={cn(
						'absolute top-[-11px] left-2',
						FLOATING_LABEL_BACKDROP_CLASS,
						props.disabled && 'text-text-menu'
					)}
				>
					{label}
				</InputLabel>
				<Select {...props}>
					<SelectTrigger
						className={cn(
							'inline-flex items-center justify-between w-full rounded border border-border-primary px-3.5 outline-none text-[0.875rem] leading-[1.125rem] h-10 font-medium gap-1 bg-white',
							'focus:border-primary focus:shadow-text-field',
							// `enabled:` rather than a bare `hover:`, so a disabled
							// trigger stays put instead of answering the pointer it is
							// refusing.
							'enabled:hover:text-primary',
							// Muted text over the page's own grey, so the field reads
							// as inert rather than as empty. The arrow is
							// `currentColor`, so it goes with the value.
							'disabled:bg-bg-body disabled:text-text-menu disabled:cursor-not-allowed'
						)}
						ref={ref}
					>
						<SelectValue placeholder={placeholder} />
						<SelectIcon>
							<Icon name="ArrowShortTop" className="size-[18px] rotate-180" />
						</SelectIcon>
					</SelectTrigger>

					<SelectPrimitive.Portal>
						<SelectContent className="z-[60]">
							<SelectViewport
								className={cn(
									'px-1.5 py-1 bg-white rounded-md shadow-popover',
									described &&
										'grid grid-cols-[max-content_minmax(0,1fr)_auto] content-start'
								)}
							>
								{options.map((item) => (
									<SelectItemField
										key={item.value}
										value={item.value}
										textValue={item.displayValue}
										render={item.render}
										description={item.description}
									/>
								))}
							</SelectViewport>
						</SelectContent>
					</SelectPrimitive.Portal>
				</Select>
			</div>
		);
	}
);

export const Select = SelectPrimitive.Root;
export const SelectTrigger = SelectPrimitive.SelectTrigger;
export const SelectValue = SelectPrimitive.Value;
export const SelectIcon = SelectPrimitive.Icon;
export const SelectContent = SelectPrimitive.Content;
export const SelectViewport = SelectPrimitive.Viewport;
export const SelectItem = SelectPrimitive.Item;
export const SelectItemText = SelectPrimitive.ItemText;
