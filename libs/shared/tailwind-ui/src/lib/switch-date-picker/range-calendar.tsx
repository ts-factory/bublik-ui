/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import {
	useLocale,
	useRangeCalendar,
	RangeCalendarProps as _RangeCalendarProps
} from 'react-aria';
import { useRangeCalendarState } from 'react-stately';
import { createCalendar, DateValue } from '@internationalized/date';

import { CalendarGrid } from './calendar-grid';
import { Button } from './calendar';
import { Icon } from '../icon';
import { DateRangePickerMode } from './date-range-picker';

interface RangeCalendarProps extends _RangeCalendarProps<DateValue> {
	mode: DateRangePickerMode;
	enabledModes?: DateRangePickerMode[];
}

export const RangeCalendar = (props: RangeCalendarProps) => {
	const ref = useRef(null);
	const { locale } = useLocale();
	const state = useRangeCalendarState({
		...props,
		visibleDuration: { months: 2 },
		locale,
		createCalendar
	});
	const { calendarProps, prevButtonProps, nextButtonProps, title } =
		useRangeCalendar(props, state, ref);

	return (
		<div {...calendarProps} ref={ref} className="overflow-hidden">
			<div className="flex items-center justify-between w-full pb-4">
				<div className="w-10 flex justify-center">
					<Button
						className="transition-colors text-text-menu hover:text-primary border border-border-primary rounded-md size-7 grid place-items-center"
						{...prevButtonProps}
					>
						<Icon name="ArrowShortTop" size={18} className="-rotate-90" />
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<span className="font-semibold">{title}</span>
				</div>
				<div className="w-10 flex justify-center">
					<Button
						className="transition-colors text-text-menu hover:text-primary border border-border-primary rounded-md size-7 grid place-items-center"
						{...nextButtonProps}
					>
						<Icon name="ArrowShortTop" size={18} className="rotate-90" />
					</Button>
				</div>
			</div>

			<div className="flex gap-8 justify-between">
				<CalendarGrid state={state} />
				<CalendarGrid state={state} offset={{ months: 1 }} />
			</div>
		</div>
	);
};
