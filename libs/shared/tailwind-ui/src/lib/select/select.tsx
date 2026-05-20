/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import {
	ChevronDownIcon,
	ChevronUpIcon,
	CheckIcon
} from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';

import { cva, VariantProps } from '../utils';
import { Icon } from '../icon';

export const selectItemStyles = cva({
	base: [
		'text-text-primary',
		'rounded',
		'flex',
		'items-center',
		'h-[25px]',
		'px-[35px]',
		'relative',
		'select-none',
		'rdx-disabled:text-text-secondary',
		'rdx-disabled:pointer-events-none',
		'rdx-state-active:text-primary',
		'focus:text-white',
		'rdx-state-active:hover:text-white',
		'hover:bg-primary',
		'hover:text-white',
		'font-normal',
		'leading-[0.875rem]',
		'text-[0.875rem]',
		'outline-none'
	]
})();

export const SelectItem: FC<SelectPrimitive.SelectItemProps> = ({ value }) => {
	return (
		<SelectPrimitive.Item value={value} className={selectItemStyles}>
			<SelectPrimitive.ItemText>{value}</SelectPrimitive.ItemText>
			<SelectPrimitive.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
				<CheckIcon />
			</SelectPrimitive.ItemIndicator>
		</SelectPrimitive.Item>
	);
};

const selectTriggerStyles = cva({
	base: [
		'inline-flex items-center justify-center rounded-md bg-white px-4 text-[1rem] font-medium gap-1 outline-none transition-colors'
	],
	variants: {
		variant: {
			primary: 'hover:text-primary',
			bordered:
				'border border-border-primary py-2 hover:border-primary hover:bg-primary-wash hover:text-primary'
		}
	}
});

export interface PaginationSelectProps extends SelectPrimitive.SelectProps {
	label: string;
	options: string[];
	triggerVariant?: VariantProps<typeof selectTriggerStyles>['variant'];
}

export const RadixSelect: FC<PaginationSelectProps> = ({
	options,
	label,
	triggerVariant = 'primary',
	...props
}) => {
	return (
		<Select {...props}>
			<SelectTrigger
				className={selectTriggerStyles({ variant: triggerVariant })}
				aria-label={label}
			>
				<SelectValue />
				<SelectIcon>
					<Icon name="ArrowShortTop" className="size-[18px] rotate-180" />
				</SelectIcon>
			</SelectTrigger>
			<SelectContent className="hidden bg-white rounded-md shadow-popover">
				<SelectScrollUpButton className="flex items-center justify-center h-[25px] bg-white hover:text-primary cursor-default text-text-primary">
					<ChevronUpIcon />
				</SelectScrollUpButton>
				<SelectViewport className="p-[5px]">
					{options.map((value) => (
						<SelectItem key={value} value={value} />
					))}
				</SelectViewport>
				<SelectScrollDownButton className="flex items-center justify-center h-[25px] bg-white hover:text-primary cursor-default text-text-primary">
					<ChevronDownIcon />
				</SelectScrollDownButton>
			</SelectContent>
		</Select>
	);
};

export const Select = SelectPrimitive.Root;
export const SelectTrigger = SelectPrimitive.Trigger;
export const SelectValue = SelectPrimitive.Value;
export const SelectIcon = SelectPrimitive.Icon;
export const SelectContent = SelectPrimitive.Content;
export const SelectViewport = SelectPrimitive.Viewport;
export const SelectGroup = SelectPrimitive.Group;
export const SelectLabel = SelectPrimitive.Label;
export const SelectSeparator = SelectPrimitive.Separator;
export const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;
export const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;
