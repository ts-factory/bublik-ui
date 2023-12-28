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

export const parseDetailDate = (dateString?: string) => {
	const DATE_FORMAT = 'MMMM dd yyyy, HH:mm';

	if (!dateString || !isValid(parseISO(dateString))) return null;

	const date = format(parseISO(dateString), DATE_FORMAT);

	return `${date} UTC`;
};
