/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

export interface RunTimeProps {
	dateTime: string;
	duration: string;
}

export const RunTime: FC<RunTimeProps> = ({ dateTime, duration }) => {
	const [date, time] = dateTime.split(',');

	return (
		<div className="flex flex-col gap-1">
			<span className="font-semibold text-[0.75rem] leading-[1.125rem]">
				{date}
			</span>
			<span className="text-[0.75rem] leading-[1.125rem]">{time},</span>
			<span className="text-[0.75rem] leading-[1.125rem]">[{duration}]</span>
		</div>
	);
};
