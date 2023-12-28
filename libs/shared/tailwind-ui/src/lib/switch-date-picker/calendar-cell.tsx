/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import {
	AriaCalendarCellProps,
	useCalendarCell,
	useFocusRing,
	mergeProps,
	useLocale
} from 'react-aria';
import {
	CalendarDate,
	getDayOfWeek,
	isSameDay,
	isSameMonth
} from '@internationalized/date';
import { CalendarState, RangeCalendarState } from '@react-stately/calendar';

import { cn, cva } from '../utils';
import { isRangePicker } from './utils';

const wrapperStyles = cva({
	base: 'w-10 h-10 outline-none group',
	variants: {
		isRoundedLeft: { true: 'rounded-l-full' },
		isRoundedRight: { true: 'rounded-r-full' },
		isSelected: { true: '' }
	},
	compoundVariants: [{ isSelected: true, class: 'bg-[#dce4ff]' }]
});

const dateStyles = cva({
	base: [
		'w-full',
		'h-full',
		'rounded-full',
		'flex',
		'items-center',
		'justify-center',
		'transition-colors',
		'outline-none',
		'text-[0.875rem]',
		'font-normal',
		'leading-6'
	],
	variants: {
		isFocusVisible: {
			true: 'ring-2 group-focus:z-2 ring-primary ring-offset-2'
		},
		isSelectionStart: { true: 'bg-primary text-white hover:bg-primary' },
		isSelectionEnd: { true: 'bg-primary text-white hover:bg-primary' },
		isSelected: { false: 'hover:bg-primary-wash hover:text-primary' },
		isOutsideMonth: { true: 'opacity-40 cursor-not-allowed' }
	},
	compoundVariants: [
		{ isSelected: true, class: 'hover:bg-primary hover:text-white' },
		{ isSelected: true, isOutsideMonth: true, class: '' }
	]
});

const outsideDateStyles = cva({
	base: [
		'w-full',
		'h-full',
		'rounded-full',
		'flex',
		'items-center',
		'justify-center',
		'transition-colors',
		'outline-none',
		'opacity-40',
		'text-text-menu',
		'text-[0.875rem]',
		'font-normal',
		'leading-6',
		'cursor-not-allowed'
	]
});

export interface CalendarCellProps {
	state: CalendarState | RangeCalendarState;
	date: AriaCalendarCellProps['date'];
	currentMonth: CalendarDate;
}

export const CalendarCell = ({
	state,
	date,
	currentMonth
}: CalendarCellProps) => {
	const ref = useRef(null);
	const { locale } = useLocale();
	const {
		cellProps,
		buttonProps,
		isSelected,
		isDisabled,
		formattedDate,
		isInvalid
	} = useCalendarCell({ date }, state, ref);
	const { focusProps, isFocusVisible } = useFocusRing();
	const isOutsideMonth = !isSameMonth(currentMonth, date);
	const isRange = isRangePicker(state);

	const isSelectionStart =
		isRange && state.highlightedRange
			? isSameDay(date, state.highlightedRange.start)
			: isSelected;

	const isSelectionEnd =
		isRange && state.highlightedRange
			? isSameDay(date, state.highlightedRange.end)
			: isSelected;

	const dayOfWeek = getDayOfWeek(date, locale);

	const isRoundedLeft =
		isSelected && (isSelectionStart || dayOfWeek === 0 || date.day === 1);

	const isRoundedRight =
		isSelected &&
		(isSelectionEnd ||
			dayOfWeek === 6 ||
			date.day === date.calendar.getDaysInMonth(date));

	const stylesInfo = {
		isRoundedLeft,
		isRoundedRight,
		isSelected,
		isDisabled,
		isOutsideMonth,
		isInvalid,
		isSelectionStart,
		isSelectionEnd,
		isFocusVisible
	};

	const wrapperClassname = wrapperStyles(stylesInfo);

	const dateClassname = isOutsideMonth
		? outsideDateStyles()
		: dateStyles(stylesInfo);

	return (
		<td
			{...cellProps}
			className={cn('py-0.5 relative', isFocusVisible ? 'z-10' : 'z-0')}
		>
			<div className={cn(wrapperClassname)}>
				<div
					{...mergeProps(buttonProps, focusProps)}
					hidden={isOutsideMonth}
					className={cn(dateClassname)}
					ref={ref}
				>
					{formattedDate}
				</div>
			</div>
		</td>
	);
};
