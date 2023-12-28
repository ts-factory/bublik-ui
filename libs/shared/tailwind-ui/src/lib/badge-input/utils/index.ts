/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export interface ParseBadgeStringOptions {
	separator: string;
	delimeter: string;
	originalDelimeter: string;
}

const PARSE_CONFIG: ParseBadgeStringOptions = {
	separator: ',',
	originalDelimeter: ':',
	delimeter: '='
};

export const parseBadgeString = (
	input: string,
	config: ParseBadgeStringOptions = PARSE_CONFIG
) => {
	const { separator, originalDelimeter, delimeter } = config;

	return input
		.split(separator)
		.map((string) => string.replace(originalDelimeter, delimeter));
};
