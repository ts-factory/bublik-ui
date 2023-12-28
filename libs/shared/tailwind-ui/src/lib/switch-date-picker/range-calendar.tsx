/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useLocale, useRangeCalendar, RangeCalendarProps } from 'react-aria';
import { useRangeCalendarState } from 'react-stately';
import { createCalendar, DateValue } from '@internationalized/date';

import { CalendarGrid } from './calendar-grid';
import { Button } from './calendar';
import { Icon } from '../icon';

export const RangeCalendar = (props: RangeCalendarProps<DateValue>) => {
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
		<div {...calendarProps} ref={ref} className="inline-block overflow-hidden">
			<div className="flex items-center justify-between w-full pb-4">
				<Button
					className="transition-colors text-text-menu hover:text-primary"
					{...prevButtonProps}
				>
					<Icon name="ArrowShortTop" className="-rotate-90" />
				</Button>
				<span className="font-semibold">{title}</span>
				<Button
					className="transition-colors text-text-menu hover:text-primary"
					{...nextButtonProps}
				>
					<Icon name="ArrowShortTop" className="rotate-90" />
				</Button>
			</div>

			<div className="flex gap-8">
				<CalendarGrid state={state} />
				<CalendarGrid state={state} offset={{ months: 1 }} />
			</div>
		</div>
	);
};
