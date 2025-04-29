/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CalendarDate, DateValue } from '@internationalized/date';
import { CalendarState, RangeCalendarState } from '@react-stately/calendar';

export const LOCALE = 'en-CA';

export type RangeValue<T> = { start: T; end: T } | null;

export const isRangeValue = (
	date: CalendarDate | RangeValue<DateValue>
): date is RangeValue<CalendarDate> => {
	return Boolean(date && ('start' in date || 'end' in date));
};

export const isRangePicker = (
	state: CalendarState | RangeCalendarState
): state is RangeCalendarState => 'highlightedRange' in state;
