/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { format, formatDistanceToNowStrict } from 'date-fns';

/** Timestamps are shown to the minute, which is all the API records. */
const MINUTE_FORMAT = 'yyyy.MM.dd / HH:mm';

export const formatMinute = (value: string | null) =>
	value ? format(new Date(value), MINUTE_FORMAT) : null;

/** Just the day, where the minute would not fit: "2026.11.27". */
export const formatDay = (value: string) =>
	format(new Date(value), 'yyyy.MM.dd');

/** The viewer's offset from GMT, "GMT +3", that the minutes are shown in. */
export const formatZone = (date = new Date()) =>
	format(date, 'O').replace(/^GMT(?=[+-])/, 'GMT ');

/**
 * The same, with the viewer's offset from GMT — "2026.11.27 / 05:11 GMT +3" —
 * for the dates a token's lifetime is judged by.
 */
export const formatMinuteWithZone = (value: string | null) => {
	if (!value) return null;

	const date = new Date(value);

	return `${format(date, MINUTE_FORMAT)} ${formatZone(date)}`;
};

/** How far off a timestamp is: "2 days ago", "in 30 days". */
export const formatRelative = (value: string) =>
	formatDistanceToNowStrict(new Date(value), { addSuffix: true });
