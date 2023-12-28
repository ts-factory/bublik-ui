/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { format } from 'date-fns';

const DATE_FORMAT = 'MMM dd yyyy, HH:mm:ss';

export interface ColumnDatesProps {
	start: string;
	end: string;
}

export const ColumnDates: FC<ColumnDatesProps> = ({ start, end }) => {
	const formattedStart = start ? format(new Date(start), DATE_FORMAT) : null;
	const formattedEnd = end ? format(new Date(end), DATE_FORMAT) : null;

	return (
		<div className="flex flex-col items-start">
			<span className="text-[0.75rem] font-medium leading-[1.125rem]">
				{formattedStart}
			</span>
			<span className="text-[0.75rem] font-medium leading-[1.125rem]">
				{formattedEnd}
			</span>
		</div>
	);
};
