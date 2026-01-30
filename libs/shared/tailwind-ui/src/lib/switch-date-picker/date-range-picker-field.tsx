/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import {
	CalendarDate,
	getLocalTimeZone,
	parseAbsolute
} from '@internationalized/date';

import { DateRangePickerProps, DateRangePicker } from './date-range-picker';

export type AriaDateFieldProps<T extends FieldValues> = DateRangePickerProps & {
	name: Path<T>;
	control: Control<T, unknown>;
};

export const AriaDateRangeField = <T extends FieldValues>(
	props: AriaDateFieldProps<T>
) => {
	const { field } = useController<T>({
		name: props.name,
		control: props.control
	});

	const handleDatesChange: DateRangePickerProps['onChange'] = (value) => {
		if (!value) return;
		const { start, end } = value;
		field.onChange({
			startDate: start.toDate(getLocalTimeZone()),
			endDate: end.toDate(getLocalTimeZone())
		});
	};

	const value = useMemo(() => {
		if (!field.value) return null;

		const start = parseAbsolute(
			field.value.startDate.toISOString(),
			getLocalTimeZone()
		);
		const end = parseAbsolute(
			field.value.endDate.toISOString(),
			getLocalTimeZone()
		);

		return {
			start: new CalendarDate(start.year, start.month, start.day),
			end: new CalendarDate(end.year, end.month, end.day)
		};
	}, [field.value]);

	return (
		<DateRangePicker
			label={props.label}
			value={value}
			onChange={handleDatesChange}
			onBlur={field.onBlur}
			ref={field.ref}
			{...props}
		/>
	);
};
