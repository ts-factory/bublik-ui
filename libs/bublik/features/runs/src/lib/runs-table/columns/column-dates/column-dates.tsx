/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { format } from 'date-fns';

const DATE_FORMAT = 'MMM dd yyyy, HH:mm:ss';

interface ColumnDatesProps {
	start: string;
	end: string;
}

function ColumnDates({ start, end }: ColumnDatesProps) {
	const formattedStart = start ? format(new Date(start), DATE_FORMAT) : null;
	const formattedEnd = end ? format(new Date(end), DATE_FORMAT) : null;

	return (
		<div className="flex flex-col items-start whitespace-nowrap w-full">
			<span className="text-[0.75rem] font-medium leading-[1.125rem]">
				{formattedStart}
			</span>
			<span className="text-[0.75rem] font-medium leading-[1.125rem]">
				{formattedEnd}
			</span>
		</div>
	);
}

export { ColumnDates };
