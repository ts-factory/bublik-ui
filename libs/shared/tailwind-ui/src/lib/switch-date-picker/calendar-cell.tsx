/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import {
	AriaCalendarCellProps,
	useCalendarCell,
	useFocusRing,
	mergeProps
} from 'react-aria';
import { CalendarDate, isSameDay, isSameMonth } from '@internationalized/date';
import { CalendarState, RangeCalendarState } from '@react-stately/calendar';

import { cn, cva } from '../utils';
import { isRangePicker } from './utils';

const wrapperStyles = cva({
	base: 'w-10 h-10 outline-none group',
	variants: {
		isRoundedLeft: { true: 'rounded-l-full' },
		isRoundedRight: { true: 'rounded-r-full' },
		isSelected: { true: 'bg-primary-wash' }
	}
});

const dateStyles = cva({
	base: [
		'w-full',
		'h-full',
		'flex',
		'items-center',
		'justify-center',
		'outline-none',
		'text-[0.875rem]',
		'font-normal',
		'leading-6'
	],
	variants: {
		isFocusVisible: {
			true: 'ring-2 group-focus:z-2 ring-primary ring-offset-2'
		},
		isSelectionStart: { true: 'bg-primary text-white rounded-lg' },
		isSelectionEnd: { true: 'bg-primary text-white rounded-lg' }
	}
});

const outsideDateStyles = cva({
	base: [
		'w-full',
		'h-full',
		'flex',
		'items-center',
		'justify-center',
		'text-[0.875rem]',
		'font-normal',
		'leading-6',
		'opacity-40',
		'cursor-not-allowed'
	]
});

interface CalendarCellProps {
	state: CalendarState | RangeCalendarState;
	date: AriaCalendarCellProps['date'];
	currentMonth: CalendarDate;
}

function CalendarCell(props: CalendarCellProps) {
	const { state, date, currentMonth } = props;
	const ref = useRef(null);
	const { cellProps, buttonProps, isSelected, formattedDate, isDisabled } =
		useCalendarCell({ date }, state, ref);
	const { focusProps, isFocusVisible } = useFocusRing();
	const isOutsideMonth = !isSameMonth(currentMonth, date);
	const isRange = isRangePicker(state);

	const isSelectionStart =
		isRange && state.highlightedRange
			? isSameDay(date, state.highlightedRange.start)
			: isSelected && !isRange;
	const isSelectionEnd =
		isRange && state.highlightedRange
			? isSameDay(date, state.highlightedRange.end)
			: isSelected && !isRange;

	const isRoundedLeft = isSelectionStart && isSelected && !isOutsideMonth;
	const isRoundedRight = isSelectionEnd && isSelected && !isOutsideMonth;

	const wrapperClassname = !isOutsideMonth
		? wrapperStyles({
				isRoundedLeft,
				isRoundedRight,
				isSelected: isSelected && !isOutsideMonth
		  })
		: '';

	const dateClassname =
		isOutsideMonth || isDisabled
			? outsideDateStyles()
			: dateStyles({
					isFocusVisible,
					isSelectionStart,
					isSelectionEnd
			  });

	return (
		<td
			{...cellProps}
			className={cn('py-0.5 relative', isFocusVisible ? 'z-10' : 'z-0')}
		>
			<div className={wrapperClassname}>
				<div
					{...mergeProps(buttonProps, focusProps)}
					className={dateClassname}
					ref={ref}
				>
					{formattedDate}
				</div>
			</div>
		</td>
	);
}

export { CalendarCell };
