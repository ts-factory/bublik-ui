/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { format, isValid, parse, parseISO } from 'date-fns';

const API_TIME_FORMAT = 'yyyy-MM-dd';
export const TIME_DOT_FORMAT = 'yyyy.MM.dd';
export const TIME_DOT_FORMAT_FULL = 'yyyy.MM.dd / HH:mm:ss';

export const formatTimeToAPI = (date: Date) => format(date, API_TIME_FORMAT);

export const parseTimeApi = (date: string) =>
	parse(date, API_TIME_FORMAT, new Date());

export const formatTimeToDot = (date?: string): string => {
	if (!date) return 'Not valid date';
	if (!isValid(parseISO(date))) return 'Not valid date';

	return format(parseISO(date), TIME_DOT_FORMAT);
};

export function formatTimezoneOffset(): string {
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

	const offsetFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'shortOffset'
	});

	const gmtOffset =
		offsetFormatter
			.formatToParts(new Date())
			.find((part) => part.type === 'timeZoneName')?.value || 'GMT';

	return gmtOffset;
}

export const parseDetailDate = (dateString?: string) => {
	if (!dateString) return null;

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return null;

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timeZone,
		year: 'numeric',
		month: 'long',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	const offsetFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timeZone,
		timeZoneName: 'shortOffset'
	});

	const gmtOffset =
		offsetFormatter
			.formatToParts(date)
			.find((part) => part.type === 'timeZoneName')?.value || timeZone;

	return `${formatter.format(date)} ${gmtOffset}`;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(timeZone: string): Intl.DateTimeFormat {
	if (!formatterCache.has(timeZone)) {
		formatterCache.set(
			timeZone,
			new Intl.DateTimeFormat('en-US', {
				timeZone,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				fractionalSecondDigits: 3,
				hour12: false
			})
		);
	}
	return formatterCache.get(timeZone)!;
}

export function formatUnixTimestampToTimezone(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

	const timeFormatter = getTimeFormatter(timeZone);

	return timeFormatter.format(date);
}

const ISO_DURATION_REGEX =
	/P(?:([\d]+\.?[\d]*|\.[\d]+)Y)?(?:([\d]+\.?[\d]*|\.[\d]+)M)?(?:([\d]+\.?[\d]*|\.[\d]+)W)?(?:([\d]+\.?[\d]*|\.[\d]+)D)?(?:T(?:([\d]+\.?[\d]*|\.[\d]+)H)?(?:([\d]+\.?[\d]*|\.[\d]+)M)?(?:([\d]+\.?[\d]*|\.[\d]+)S)?)?$/;

/**
 * Use this until date-fns merged this:
 * https://github.com/date-fns/date-fns/pull/3151
 *
 *
 * @name parseISODuration
 * @category Common Helpers
 * @summary Parse ISO Duration string
 *
 * @description
 * Parse the given string in ISO 8601 format and return Duration object.
 *
 * Function accepts duration format of ISO 8601.
 * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
 * Specifically: https://en.wikipedia.org/wiki/ISO_8601#Durations
 *
 * If the argument is not a valid ISO Duration it will throw Invalid format error.
 *
 * @param argument - ISO Duration string
 * @returns Parsed duration object
 *
 * @throws It throws an "Invalid format" error if the string doesn't match the ISO Duration format
 *
 * @example
 * // Convert string 'P3Y6M4DT12H30M5S' to duration:
 * const result = parseISODuration('P3Y6M4DT12H30M5S')
 * //=>
 * const result = {
 *   years: 3,
 *   months: 6,
 *   weeks: 0,
 *   days: 4,
 *   hours: 12,
 *   minutes: 30,
 *   seconds: 5,
 * }
 */

export function parseISODuration(argument: string): Duration {
	const parsedArgument = argument.replace(/,/g, '.'); // Decimal fraction may be specified with either a comma or a full stop

	const match = parsedArgument.match(ISO_DURATION_REGEX);

	if (!match) {
		throw new RangeError('Invalid format');
	}

	const [
		,
		years = 0,
		months = 0,
		weeks = 0,
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0
	] = match;

	const entries = Object.entries({
		years,
		months,
		weeks,
		days,
		hours,
		minutes,
		seconds
	}) as [keyof Duration, string][];

	return entries.reduce<Duration>((prev, [key, value]) => {
		prev[key] = +value;
		return prev;
	}, {});
}

export function formatDurationToShort(durationObject: Duration) {
	const units = [
		{ label: 'y', value: durationObject.years },
		{ label: 'mo', value: durationObject.months },
		{ label: 'w', value: durationObject.weeks },
		{ label: 'd', value: durationObject.days },
		{ label: 'h', value: durationObject.hours },
		{ label: 'm', value: durationObject.minutes },
		{ label: 's', value: durationObject.seconds }
	];

	for (const { label, value = 0 } of units) {
		if (value > 0) return `${value}${label}`;
	}
}

export function formatDurationToHMS(durationObject: Duration): string {
	const padZero = (num: number): string => num.toString().padStart(2, '0');

	const totalSeconds =
		(durationObject.years ?? 0) * 31536000 + // 1 year = 365 days
		(durationObject.months ?? 0) * 2592000 + // 1 month = 30 days
		(durationObject.weeks ?? 0) * 604800 + // 1 week = 7 days
		(durationObject.days ?? 0) * 86400 + // 1 day = 24 hours
		(durationObject.hours ?? 0) * 3600 +
		(durationObject.minutes ?? 0) * 60 +
		Math.round(durationObject.seconds ?? 0);

	// Calculate hours, minutes, and seconds
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	// Format with leading zeros
	return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

export function calculateAbsoluteTimestamp(
	runStartISO: string,
	testTime: string
): Date {
	const runStart = new Date(runStartISO);

	const [hours, minutes, seconds] = testTime.split(':').map(Number);
	const msStr = seconds.toString().split('.')[1];
	const ms = msStr ? parseFloat(`0.${msStr}`) * 1000 : 0;
	const wholeSeconds = Math.floor(seconds);

	const result = new Date(
		Date.UTC(
			runStart.getUTCFullYear(),
			runStart.getUTCMonth(),
			runStart.getUTCDate(),
			hours,
			minutes,
			wholeSeconds,
			ms
		)
	);

	if (result < runStart) {
		result.setUTCDate(result.getUTCDate() + 1);
	}

	return result;
}

export function calculateAbsoluteTestTimes(
	runStartISO: string,
	testStart: string,
	testEnd?: string
): { start: Date; end?: Date } {
	const start = calculateAbsoluteTimestamp(runStartISO, testStart);
	let end: Date | undefined;

	if (testEnd) {
		end = calculateAbsoluteTimestamp(runStartISO, testEnd);
		if (end < start) {
			end.setUTCDate(end.getUTCDate() + 1);
		}
	}

	return { start, end };
}

export function formatTimestampToFull(dateString?: string | Date): string {
	if (!dateString) return 'N/A';

	const date =
		typeof dateString === 'string' ? new Date(dateString) : dateString;

	if (Number.isNaN(date.getTime())) return 'N/A';

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: 'long',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3,
		hour12: false
	});

	const offsetFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'shortOffset'
	});

	const gmtOffset =
		offsetFormatter
			.formatToParts(date)
			.find((part) => part.type === 'timeZoneName')?.value || timeZone;

	const formatted = `${formatter.format(date)} ${gmtOffset}`;
	return formatted;
}

export function formatDurationWithMs(durationString?: string): string {
	if (!durationString) return 'N/A';

	const parts = durationString.split(':');
	if (parts.length !== 3) return durationString;

	const hours = parseInt(parts[0] || '0', 10);
	const minutes = parseInt(parts[1] || '0', 10);
	const secondsStr = parts[2] || '0';
	const secondsParts = secondsStr.split('.');
	const seconds = parseInt(secondsParts[0] || '0', 10);
	const msStr = secondsParts[1] || '000';
	const ms = msStr.padEnd(3, '0');
	const hasMs = parseInt(msStr, 10) > 0;

	const result: string[] = [];

	if (hours > 0) result.push(`${hours}h`);
	if (minutes > 0 || hours > 0) result.push(`${minutes}m`);

	if (hasMs) {
		result.push(`${seconds}.${ms}s`);
	} else {
		result.push(`${seconds}s`);
	}

	return result.join(' ');
}
