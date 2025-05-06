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
import { upperCaseFirstLetter } from '@/shared/utils';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '../dropdown';

import { CalendarGrid } from './calendar-grid';
import { Button } from './calendar';
import { Icon } from '../icon';
import { DateRangePickerMode } from './date-range-picker';
import { ButtonTw } from '../button';

interface RangeCalendarProps extends _RangeCalendarProps<DateValue> {
	mode: DateRangePickerMode;
	onModeChange: (mode: string) => void;
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
					{props.enabledModes?.length ?? 0 > 1 ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<ButtonTw
									className="size-8 grid place-items-center p-0 hover:text-primary"
									variant="ghost"
								>
									<Icon name="Gear" size={20} />
								</ButtonTw>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuLabel>Calendar Mode</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuRadioGroup
									value={props.mode}
									onValueChange={props.onModeChange}
								>
									{props.enabledModes?.map((mode) => (
										<DropdownMenuRadioItem value={mode}>
											{upperCaseFirstLetter(mode)}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
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
