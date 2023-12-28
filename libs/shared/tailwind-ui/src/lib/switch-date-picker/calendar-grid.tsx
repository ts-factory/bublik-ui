/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { AriaCalendarGridProps, useCalendarGrid } from '@react-aria/calendar';
import {
	DateDuration,
	endOfMonth,
	getWeeksInMonth
} from '@internationalized/date';
import { useLocale } from '@react-aria/i18n';
import { CalendarState, RangeCalendarState } from '@react-stately/calendar';

import { CalendarCell } from './calendar-cell';

export interface CalendarGridProps extends AriaCalendarGridProps {
	state: CalendarState | RangeCalendarState;
	offset?: DateDuration;
}

export const CalendarGrid: FC<CalendarGridProps> = ({ state, offset = {} }) => {
	const { locale } = useLocale();
	const startDate = state.visibleRange.start.add(offset);
	const endDate = endOfMonth(startDate);
	const { gridProps, headerProps, weekDays } = useCalendarGrid(
		{ startDate, endDate },
		state
	);

	// Get the number of weeks in the month, so we can render the proper number of rows.
	const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

	return (
		<table {...gridProps} className="flex-1" cellPadding={0}>
			<thead {...headerProps}>
				<tr>
					{weekDays.map((day, index) => (
						<th key={index} className="text-xs leading-6 text-text-menu">
							{day}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{[...new Array(weeksInMonth).keys()].map((weekIndex) => (
					<tr key={weekIndex}>
						{state
							.getDatesInWeek(weekIndex, startDate)
							.map((date, i) =>
								date ? (
									<CalendarCell
										key={i}
										state={state}
										date={date}
										currentMonth={startDate}
									/>
								) : (
									<td key={i} />
								)
							)}
					</tr>
				))}
			</tbody>
		</table>
	);
};
