/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ChangeEvent,
	ComponentProps,
	FC,
	forwardRef,
	useRef,
	LegacyRef
} from 'react';
import { AriaButtonProps, useButton } from 'react-aria';
import {
	CalendarState,
	RangeCalendarState,
	useCalendarState
} from '@react-stately/calendar';
import { CalendarProps, useCalendar } from '@react-aria/calendar';
import { useDateFormatter, useLocale } from '@react-aria/i18n';
import {
	CalendarDate,
	createCalendar,
	DateValue
} from '@internationalized/date';

import { CalendarGrid } from './calendar-grid';
import { mergeRefs } from '@react-aria/utils';
import { Icon } from '../icon';

export const Button = forwardRef<
	HTMLButtonElement,
	AriaButtonProps & { className?: string }
>(({ className, children, ...props }, ref) => {
	const buttonRef = useRef(null);
	const { buttonProps } = useButton(props, buttonRef);

	return (
		<button
			className={className}
			{...buttonProps}
			ref={mergeRefs(buttonRef, ref) as LegacyRef<HTMLButtonElement>}
		>
			{children}
		</button>
	);
});

export const Calendar: FC<CalendarProps<DateValue>> = (props) => {
	const { locale } = useLocale();
	const state = useCalendarState({
		...props,
		locale,
		createCalendar
	});

	const ref = useRef(null);
	const { calendarProps, prevButtonProps, nextButtonProps } = useCalendar(
		props,
		state
	);

	return (
		<div {...calendarProps} ref={ref} className="inline-block text-gray-800">
			<div className="flex items-center justify-between w-full pb-4">
				<Button
					{...prevButtonProps}
					className="transition-colors rounded text-text-menu hover:text-primary hover:bg-primary-wash"
				>
					<Icon name="ArrowShortTop" size={28} className="-rotate-90" />
				</Button>
				<div className="flex items-center gap-4">
					<div className="pl-4">
						<YearDropdown state={state} />
					</div>
					<div className="pr-4">
						<MonthDropdown state={state} />
					</div>
				</div>
				<Button
					{...nextButtonProps}
					className="transition-colors rounded text-text-menu hover:text-primary hover:bg-primary-wash"
				>
					<Icon name="ArrowShortTop" size={28} className="rotate-90" />
				</Button>
			</div>
			<div className="flex gap-8">
				<CalendarGrid state={state} />
			</div>
		</div>
	);
};

export const YearDropdown: FC<{
	state: CalendarState | RangeCalendarState;
}> = ({ state }) => {
	const years: { value: CalendarDate; formatted: string }[] = [];
	const formatter = useDateFormatter({
		year: 'numeric',
		timeZone: state.timeZone
	});

	// Format 20 years on each side of the current year according
	// to the current locale and calendar system.
	for (let i = -20; i <= 20; i++) {
		const date = state.focusedDate.add({ years: i });
		years.push({
			value: date,
			formatted: formatter.format(date.toDate(state.timeZone))
		});
	}

	const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const index = Number(e.target.value);
		const date = years[index].value;
		state.setFocusedDate(date);
	};

	return (
		<select
			aria-label="Year"
			onChange={onChange}
			value={20}
			className="block w-full py-2 pl-3 pr-10 text-base rounded-md border-border-primary focus:outline-none focus:shadow-text-field focus:border-primary focus:ring-transparent sm:text-sm"
		>
			{years.map((year, i) => (
				// use the index as the value so we can retrieve the full
				// date object from the list in onChange. We cannot only
				// store the year number, because in some calendars, such
				// as the Japanese, the era may also change.
				<option key={i} value={i}>
					{year.formatted}
				</option>
			))}
		</select>
	);
};

export const MonthDropdown: FC<{
	state: CalendarState | RangeCalendarState;
}> = ({ state }) => {
	const months = [];
	const formatter = useDateFormatter({
		month: 'long',
		timeZone: state.timeZone
	});

	// Format the name of each month in the year according to the
	// current locale and calendar system. Note that in some calendar
	// systems, such as the Hebrew, the number of months may differ
	// between years.
	const numMonths = state.focusedDate.calendar.getMonthsInYear(
		state.focusedDate
	);
	for (let i = 1; i <= numMonths; i++) {
		const date = state.focusedDate.set({ month: i });
		months.push(formatter.format(date.toDate(state.timeZone)));
	}

	const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const value = Number(e.target.value);
		const date = state.focusedDate.set({ month: value });
		state.setFocusedDate(date);
	};

	return (
		<select
			aria-label="Month"
			onChange={onChange}
			value={state.focusedDate.month}
			className="block w-full py-2 pl-3 pr-10 text-base rounded-md border-border-primary focus:outline-none focus:shadow-text-field focus:border-primary focus:ring-transparent sm:text-sm"
		>
			{months.map((month, i) => (
				<option key={i} value={i + 1}>
					{month}
				</option>
			))}
		</select>
	);
};
