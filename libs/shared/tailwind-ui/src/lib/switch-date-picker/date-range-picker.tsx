/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, Ref, useRef } from 'react';
import { useDateRangePicker, AriaDateRangePickerProps } from 'react-aria';
import { DateRangePickerState, useDateRangePickerState } from 'react-stately';
import { mergeRefs } from '@react-aria/utils';
import { DateValue } from '@internationalized/date';

import { DateField } from './date-field';
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger
} from '../popover';
import { RangeCalendar } from './range-calendar';
import { Button } from './calendar';
import { cn } from '../utils';
import { Icon } from '../icon';
import { DateRange } from './types';
import { DEFAULT_RANGES } from './constants';

type AddedProps = {
	ranges?: DateRange[];
	hideLabel?: boolean;
};

type DefaultDateRangePickerProps = AriaDateRangePickerProps<DateValue> &
	AddedProps & {
		mode?: 'default';
	};

type DurationDateRangePickerProps = AriaDateRangePickerProps<DateValue> &
	AddedProps & {
		mode?: 'duration';
	};

export type DateRangePickerProps =
	| DefaultDateRangePickerProps
	| DurationDateRangePickerProps;

function DateRangePicker(
	props: DateRangePickerProps,
	ref: Ref<HTMLDivElement>
) {
	const groupRef = useRef<HTMLDivElement>(null);
	const state = useDateRangePickerState(props);

	const {
		groupProps,
		labelProps,
		startFieldProps,
		endFieldProps,
		buttonProps,
		dialogProps,
		calendarProps
	} = useDateRangePicker(props, state, groupRef);

	const ranges = props?.ranges || DEFAULT_RANGES;

	return (
		<Popover open={state.isOpen}>
			<PopoverAnchor className="relative flex w-full gap-1">
				<div className="relative inline-flex flex-col w-full text-left">
					<span
						{...labelProps}
						className={cn(
							'absolute top-[-11px] left-2 z-10 bg-white font-normal text-text-secondary text-[0.875rem]',
							props.hideLabel && 'sr-only'
						)}
					>
						{props.label}
					</span>
					<div
						{...groupProps}
						ref={mergeRefs(groupRef, ref)}
						className="flex group"
					>
						<div
							className={cn(
								'relative flex items-center w-full h-10 px-2 transition-all bg-white border rounded-md border-border-primary group-hover:border-primary group-focus-within:border-primary group-focus-within:shadow-text-field group-active:shadow-none',
								state.isOpen && 'border-primary shadow-text-field'
							)}
						>
							<div className="flex items-center justify-between w-full h-full gap-2">
								<div className="flex items-center justify-between w-full h-full">
									<DateField {...startFieldProps} underline />
									<span aria-hidden="true" className="px-2">
										–
									</span>
									<DateField {...endFieldProps} underline />
									<div className="flex items-center gap-4 pl-3">
										{state.isInvalid ? (
											<PopoverTrigger asChild>
												<Button {...buttonProps}>
													<Icon
														name="TriangleExclamationMark"
														size={24}
														className="text-text-unexpected"
													/>
												</Button>
											</PopoverTrigger>
										) : (
											<PopoverTrigger asChild>
												<Button {...buttonProps}>
													<Icon
														name="Calendar"
														className="transition-colors text-text-menu hover:text-primary"
													/>
												</Button>
											</PopoverTrigger>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</PopoverAnchor>
			<PopoverContent
				className="p-4 bg-white rounded-xl shadow-popover"
				alignOffset={8}
				onInteractOutside={state.close}
				onEscapeKeyDown={state.close}
				sideOffset={8}
				{...dialogProps}
			>
				<RangeCalendar {...calendarProps} />
				{ranges && ranges.length ? (
					<DateRangesHelper state={state} ranges={ranges} />
				) : null}
			</PopoverContent>
		</Popover>
	);
}

interface DateRangesHelperProps {
	state: DateRangePickerState;
	ranges: DateRange[];
}

function DateRangesHelper(props: DateRangesHelperProps) {
	const { state, ranges } = props;

	return (
		<ul className="flex items-center gap-4 mt-4">
			{ranges.map(({ label, range }) => (
				<button
					key={label}
					type="button"
					onClick={() => {
						if (!range) return;
						state.setDateRange(range);
					}}
					className="px-1.5 py-1 text-sm rounded-lg bg-primary-wash border-2 border-transparent hover:border-[#94b0ff] transition-all text-primary"
				>
					{label}
				</button>
			))}
		</ul>
	);
}

function isDurationRangePicker(
	props: DateRangePickerProps
): props is DurationDateRangePickerProps {
	return props.mode === 'duration';
}

const picker = forwardRef(DateRangePicker);

export { picker as DateRangePicker };
