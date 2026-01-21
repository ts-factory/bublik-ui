/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

export interface RunTimeProps {
	dateTime: string;
	duration: string;
}

export const RunTime: FC<RunTimeProps> = ({ dateTime, duration }) => {
	const dateObj = new Date(dateTime);

	const formattedDate = dateObj.toLocaleDateString('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric'
	});

	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const seconds = dateObj.getSeconds().toString().padStart(2, '0');
	const milliseconds = dateObj.getMilliseconds().toString().padStart(3, '0');

	const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

	return (
		<div className="flex flex-col gap-1">
			<span className="font-semibold text-[0.75rem] leading-[1.125rem]">
				{formattedDate}
			</span>
			<span className="text-[0.75rem] leading-[1.125rem]">
				{formattedTime},
			</span>
			<span className="text-[0.75rem] leading-[1.125rem]">[{duration}]</span>
		</div>
	);
};
