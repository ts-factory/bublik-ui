/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Row } from '@tanstack/react-table';

import { toast } from '@/shared/tailwind-ui';
import { LogJsonTimestamp, LogTableData } from '@/shared/types';

import { useDeltaContext } from '../log-table.context';
import { LOG_COLUMNS } from '../log-table.columns';

export type TimestampDeltaProps = {
	data: LogTableData['timestamp'];
	row: Row<LogTableData>;
	showDelta?: boolean;
};

export const TimestampDelta = (props: TimestampDeltaProps) => {
	const { data: value, row, showDelta } = props;
	const { anchorRow, setAnchorRow } = useDeltaContext();

	// eslint-disable-next-line react/jsx-no-useless-fragment
	if (!showDelta) return <>{value.formatted}</>;

	const anchorSeconds = anchorRow.getValue<LogJsonTimestamp>(
		LOG_COLUMNS.timestamp
	).timestamp;
	const compareSeconds = row.getValue<LogJsonTimestamp>(
		LOG_COLUMNS.timestamp
	).timestamp;

	const handleAnchroClick = () => {
		setAnchorRow(row);
	};

	return (
		<button
			className="inline px-1 py-0.5 ml-auto rounded hover:bg-primary hover:text-white w-full text-right"
			onClick={handleAnchroClick}
		>
			{formatDelta(anchorSeconds, compareSeconds)}
		</button>
	);
};

export const formatDelta = (anchorSeconds: number, compareSeconds: number) => {
	const PADDING_SYMBOL = '0';

	// 1. Prepare
	const deltaInSeconds = (compareSeconds - anchorSeconds) * 1000;
	const absoluteChange = Math.abs(deltaInSeconds);
	const totalSeconds = Math.floor(absoluteChange / 1000);

	// 2. Calculate
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const milliseconds = absoluteChange % 1000;

	// 3. Format
	const sign = deltaInSeconds === 0 ? '' : deltaInSeconds > 0 ? '+ ' : '- ';
	const formattedHours = hours.toString().padStart(2, PADDING_SYMBOL);
	const formattedMinutes = minutes.toString().padStart(2, PADDING_SYMBOL);
	const formattedSeconds = seconds.toString().padStart(2, PADDING_SYMBOL);
	const formattedMilliseconds = Math.floor(milliseconds);

	return `${sign}${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};
