/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useMemo, useRef, LegacyRef } from 'react';
import { useDatePickerState } from '@react-stately/datepicker';
import { useButton } from 'react-aria';
import { AriaDatePickerProps, useDatePicker } from '@react-aria/datepicker';
import {
	DateValue,
	getLocalTimeZone,
	parseAbsolute
} from '@internationalized/date';
import { mergeRefs } from '@react-aria/utils';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { Calendar } from './calendar';
import { DateField } from './date-field';
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger
} from '../popover';
import { cn } from '../utils';
import { Icon } from '../icon';

export interface AriaDatePickerFieldProps<T extends FieldValues>
	extends AriaDatePickerProps<DateValue> {
	name: Path<T>;
	control: Control<T, unknown>;
}

export const DatePickerField = <T extends FieldValues>(
	props: AriaDatePickerFieldProps<T>
) => {
	const { field } = useController<T>({
		name: props.name,
		control: props.control
	});

	const handleDatesChange: AriaDatePickerProps<DateValue>['onChange'] = (
		date
	) => date && field.onChange(date.toDate(getLocalTimeZone()));

	const value = useMemo(() => {
		return field.value
			? parseAbsolute(field.value.toISOString(), getLocalTimeZone())
			: undefined;
	}, [field.value]);

	return (
		<DatePicker
			label={props.label}
			value={value}
			onChange={handleDatesChange}
			onBlur={field.onBlur}
			ref={field.ref}
		/>
	);
};

export const DatePicker = forwardRef<
	HTMLDivElement,
	AriaDatePickerProps<DateValue>
>((props, ref) => {
	const groupRef = useRef(null);
	const buttonRef = useRef(null);

	const state = useDatePickerState(props);
	const {
		groupProps,
		buttonProps: ariaButtonProps,
		fieldProps,
		dialogProps,
		calendarProps,
		labelProps
	} = useDatePicker(props, state, groupRef);

	const { buttonProps } = useButton(ariaButtonProps, buttonRef);

	return (
		<Popover open={state.isOpen}>
			<PopoverAnchor
				className={cn(
					'relative flex gap-1 border rounded w-fit border-border-primary px-3.5 h-10 focus-within:border-primary focus-within:shadow-text-field transition-all',
					state.isOpen && 'border-primary shadow-text-field'
				)}
			>
				<span className="sr-only" {...labelProps}>
					{props.label}
				</span>

				<label
					{...labelProps}
					className="absolute top-[-11px] left-2 font-normal text-[0.875rem] text-text-secondary bg-white"
				>
					{props.label}
				</label>

				<div
					{...groupProps}
					ref={mergeRefs(groupRef, ref) as LegacyRef<HTMLDivElement>}
					className="flex gap-2"
				>
					<DateField {...fieldProps} />
					{state.validationState === 'invalid' && <div>Invalid</div>}
					<PopoverTrigger asChild>
						<button {...buttonProps} ref={buttonRef}>
							<Icon
								name="Calendar"
								size={24}
								className="transition-colors text-text-menu hover:text-primary"
							/>
						</button>
					</PopoverTrigger>
				</div>
			</PopoverAnchor>

			<PopoverContent
				className="px-8 py-6 bg-white rounded-xl shadow-popover"
				onInteractOutside={state.close}
				onEscapeKeyDown={state.close}
				sideOffset={8}
				{...dialogProps}
			>
				<Calendar {...calendarProps} />
			</PopoverContent>
		</Popover>
	);
});
