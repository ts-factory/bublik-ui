/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export interface ParseBadgeStringOptions {
	separator: string;
	delimeter: string;
	originalDelimeter: string;
	quote?: string;
}

const DEFAULT_QUOTE = '"';

const PARSE_CONFIG: ParseBadgeStringOptions = {
	separator: ',',
	originalDelimeter: ':',
	delimeter: '=',
	quote: DEFAULT_QUOTE
};

const normalizeBadgeValue = (
	value: string,
	wasQuoted: boolean,
	config: ParseBadgeStringOptions
): string => {
	const normalizedValue = wasQuoted ? value : value.trim();

	return normalizedValue.replace(config.originalDelimeter, config.delimeter);
};

export const parseBadgeString = (
	input: string,
	config: ParseBadgeStringOptions = PARSE_CONFIG
): string[] => {
	const { separator } = config;
	const quote = config.quote ?? DEFAULT_QUOTE;
	const result: string[] = [];
	let current = '';
	let isInsideQuote = false;
	let wasQuoted = false;
	let isAfterClosingQuote = false;

	const pushCurrent = (): void => {
		result.push(normalizeBadgeValue(current, wasQuoted, config));
		current = '';
		wasQuoted = false;
		isAfterClosingQuote = false;
	};

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];
		const nextChar = input[index + 1];

		if (char === quote) {
			if (isInsideQuote && nextChar === quote) {
				current += quote;
				index += 1;
				continue;
			}

			if (isInsideQuote) {
				isInsideQuote = false;
				isAfterClosingQuote = true;
				continue;
			}

			if (current.trim().length === 0) {
				current = '';
				isInsideQuote = true;
				wasQuoted = true;
				continue;
			}
		}

		if (char === separator && !isInsideQuote) {
			pushCurrent();
			continue;
		}

		if (isAfterClosingQuote && char.trim().length === 0) continue;

		isAfterClosingQuote = false;
		current += char;
	}

	pushCurrent();

	return result;
};

export const formatBadgeString = (
	values: string[],
	config: Pick<ParseBadgeStringOptions, 'separator' | 'quote'> = PARSE_CONFIG
): string => {
	const { separator } = config;
	const quote = config.quote ?? DEFAULT_QUOTE;

	return values
		.map((value) => {
			const needsQuotes =
				value.includes(separator) ||
				value.includes(quote) ||
				value.trim() !== value;

			if (!needsQuotes) return value;

			return `${quote}${value.split(quote).join(`${quote}${quote}`)}${quote}`;
		})
		.join(`${separator} `);
};
