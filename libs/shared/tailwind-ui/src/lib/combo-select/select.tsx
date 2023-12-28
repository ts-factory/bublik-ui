/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';

import { Icon } from '../icon';

export type SelectItemFieldProps = SelectPrimitive.SelectItemProps;

const SelectItemField = (props: SelectItemFieldProps) => {
	return (
		<SelectItem
			{...props}
			className="relative rounded justify-between focus:bg-primary-wash text-xs font-medium text-text-secondary flex items-center h-12 py-3.5 px-3.5 outline-none rdx-state-active:text-primary hover:bg-primary-wash"
		>
			<SelectItemText>{props.textValue || props.value}</SelectItemText>
			<SelectPrimitive.ItemIndicator>
				<CheckIcon width={20} height={20} />
			</SelectPrimitive.ItemIndicator>
		</SelectItem>
	);
};

export type SelectValue = {
	value: string;
	displayValue?: string;
};

export interface SelectProps extends SelectPrimitive.SelectProps {
	label: string;
	options: SelectValue[];
	placeholder?: string;
}

export const SelectInput = forwardRef<HTMLButtonElement, SelectProps>(
	({ label, options, defaultValue, placeholder, ...props }, ref) => {
		return (
			<div className="relative flex w-full min-w-[240px]">
				<label className="absolute top-[-11px] left-2 font-normal text-[0.875rem] text-text-secondary bg-white">
					{label}
				</label>
				<Select {...props}>
					<SelectTrigger
						className="inline-flex items-center justify-between w-full rounded border border-border-primary px-3.5 outline-none text-[0.875rem] leading-[1.125rem] h-10 font-medium gap-1 bg-white hover:text-primary focus:border-primary focus:shadow-text-field"
						ref={ref}
					>
						<SelectValue placeholder={placeholder} />
						<SelectIcon>
							<Icon name="ChevronDown" size={16} />
						</SelectIcon>
					</SelectTrigger>

					<SelectPrimitive.Portal>
						<SelectContent className="z-[60]">
							<SelectViewport className="px-1.5 py-1 bg-white rounded-md shadow-popover">
								{options.map((item) => (
									<SelectItemField
										key={item.value}
										value={item.value}
										textValue={item.displayValue}
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
