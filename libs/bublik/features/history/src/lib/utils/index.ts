/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { nanoid } from '@reduxjs/toolkit';

import { HistoryAPIQuery } from '@/shared/types';
import { BadgeItem } from '@/shared/tailwind-ui';

import { HistoryGlobalFilter } from '../slice';

export const queryArrToBadges = (
	str?: string,
	isExpression?: boolean
): BadgeItem[] => {
	if (str) {
		return str.split(';').map((str) => ({
			value: str,
			originalValue: str,
			id: nanoid(4),
			isExpression: isExpression
		}));
	}

	return [];
};

export const queryArrToString = (config: {
	value?: string;
	defaultValue: string[];
}): string[] => {
	const { value, defaultValue } = config;

	if (value) return value.split(';');

	return defaultValue;
};

export const queryToGlobalFilter = (
	query: HistoryAPIQuery
): HistoryGlobalFilter => {
	return {
		verdicts: queryArrToString({ value: query.verdict, defaultValue: [] }),
		parameters: queryArrToString({ value: query.parameters, defaultValue: [] }),
		tags: queryArrToString({ value: query.runData, defaultValue: [] }),
		resultType: null,
		isNotExpected: null,
		substringFilter: ''
	};
};
