/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, forwardRef, useRef } from 'react';
import { useDateRangePicker, AriaDateRangePickerProps } from 'react-aria';
import { DateRangePickerState, useDateRangePickerState } from 'react-stately';
import { mergeRefs } from '@react-aria/utils';
import { DateValue, getLocalTimeZone, today } from '@internationalized/date';

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
import { RangeValue } from './utils';
import { Icon } from '../icon';

export const DEFAULT_RANGES: DateRange[] = [
	{
		label: 'One Week',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Two Weeks',
		range: {
			start: today(getLocalTimeZone()).add({ weeks: -2 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'One Month',
		range: {
			start: today(getLocalTimeZone()).add({ months: -1 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Three Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -3 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'Six Months',
		range: {
			start: today(getLocalTimeZone()).add({ months: -6 }),
			end: today(getLocalTimeZone())
		}
	},
	{
		label: 'One Year',
		range: {
			start: today(getLocalTimeZone()).add({ years: -1 }),
			end: today(getLocalTimeZone())
		}
	}
];

export type DateRange = {
	label: string;
	range: RangeValue<DateValue>;
};

export interface DateRangesHelperProps {
	state: DateRangePickerState;
	ranges: DateRange[];
}

const DateRangesHelper: FC<DateRangesHelperProps> = (props) => {
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
};

export interface DateRangePickerProps
	extends AriaDateRangePickerProps<DateValue> {
	ranges?: DateRange[];
	hideLabel?: boolean;
}

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
	(props, ref) => {
		const { ranges = DEFAULT_RANGES, ...restProps } = props;

		const groupRef = useRef<HTMLDivElement>(null);
		const state = useDateRangePickerState(restProps);
		const {
			groupProps,
			labelProps,
			startFieldProps,
			endFieldProps,
			buttonProps,
			dialogProps,
			calendarProps
		} = useDateRangePicker(restProps, state, groupRef);

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
					className="px-8 py-6 bg-white rounded-xl shadow-popover"
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
);
