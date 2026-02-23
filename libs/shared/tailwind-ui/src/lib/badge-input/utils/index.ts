/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	normalizeKeyValueForSubmit
} from '@/shared/utils';

export interface ParseBadgeStringOptions {
	separator: string;
	submitDelimiter?: string;
	displayDelimiter?: string;
	quote?: string;
}

const DEFAULT_QUOTE = '"';

const PARSE_CONFIG: ParseBadgeStringOptions = {
	separator: ',',
	displayDelimiter: DEFAULT_KEY_VALUE_DISPLAY_DELIMITER,
	submitDelimiter: DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	quote: DEFAULT_QUOTE
};

const normalizeBadgeValue = (
	value: string,
	wasQuoted: boolean,
	config: ParseBadgeStringOptions
): string => {
	if (wasQuoted) {
		const leadingWhitespaceLength = value.length - value.trimStart().length;
		const trailingWhitespaceLength = value.length - value.trimEnd().length;
		const leadingWhitespace = value.slice(0, leadingWhitespaceLength);
		const trailingWhitespace = value.slice(
			value.length - trailingWhitespaceLength
		);
		const coreValue = value.slice(
			leadingWhitespaceLength,
			value.length - trailingWhitespaceLength
		);

		if (!coreValue.length) return value;

		const normalizedCoreValue = normalizeKeyValueForSubmit(coreValue, {
			displayDelimiter: config.displayDelimiter,
			submitDelimiter: config.submitDelimiter
		});

		return `${leadingWhitespace}${normalizedCoreValue}${trailingWhitespace}`;
	}

	return normalizeKeyValueForSubmit(value, {
		displayDelimiter: config.displayDelimiter,
		submitDelimiter: config.submitDelimiter
	});
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
		const value = normalizeBadgeValue(current, wasQuoted, config);

		if (value || wasQuoted) result.push(value);

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
