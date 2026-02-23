/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { normalizeKeyValueForSubmit } from '@/shared/utils';

export interface ParseBadgeStringOptions {
	separator: string;
	submitDelimiter: string;
	displayDelimiter: string;
}

const PARSE_CONFIG: ParseBadgeStringOptions = {
	separator: ',',
	displayDelimiter: ':',
	submitDelimiter: '='
};

export const parseBadgeString = (
	input: string,
	config: ParseBadgeStringOptions = PARSE_CONFIG
) => {
	const { separator, displayDelimiter, submitDelimiter } = config;

	return input
		.split(separator)
		.map((value) =>
			normalizeKeyValueForSubmit(value, { displayDelimiter, submitDelimiter })
		)
		.filter(Boolean);
};
