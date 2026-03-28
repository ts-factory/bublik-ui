/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

export interface KeyValueDelimiterOptions {
	submitDelimiter?: string;
	displayDelimiter?: string;
}

export const DEFAULT_KEY_VALUE_SUBMIT_DELIMITER = '=';
export const DEFAULT_KEY_VALUE_DISPLAY_DELIMITER = ': ';

const normalizeDelimiters = (options: KeyValueDelimiterOptions = {}) => {
	return {
		submitDelimiter:
			options.submitDelimiter ?? DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
		displayDelimiter:
			options.displayDelimiter ?? DEFAULT_KEY_VALUE_DISPLAY_DELIMITER
	};
};

export const hasSubmitDelimiter = (
	value: string,
	submitDelimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
) => {
	if (!submitDelimiter.length) return false;

	return value.includes(submitDelimiter);
};

export const getKeyValueParts = (
	value: string,
	submitDelimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
): [string, string | undefined] => {
	if (!submitDelimiter.length) return [value, undefined];

	const delimiterIndex = value.indexOf(submitDelimiter);

	if (delimiterIndex === -1) return [value, undefined];

	const key = value.slice(0, delimiterIndex);
	const parsedValue = value.slice(delimiterIndex + submitDelimiter.length);

	return [key, parsedValue];
};

export const formatKeyValueForDisplay = (
	value: string,
	options: KeyValueDelimiterOptions = {}
) => {
	const { submitDelimiter, displayDelimiter } = normalizeDelimiters(options);
	const [key, parsedValue] = getKeyValueParts(value, submitDelimiter);

	if (typeof parsedValue === 'undefined') return value;

	return `${key}${displayDelimiter}${parsedValue}`;
};

export const normalizeKeyValueForSubmit = (
	rawValue: string,
	options: KeyValueDelimiterOptions = {}
) => {
	const { submitDelimiter, displayDelimiter } = normalizeDelimiters(options);
	const value = rawValue.trim();

	if (!value.length) return value;
	if (!submitDelimiter.length || !displayDelimiter.length) return value;
	if (hasSubmitDelimiter(value, submitDelimiter)) return value;

	const displayDelimiters = Array.from(
		new Set([
			displayDelimiter,
			displayDelimiter.trimEnd(),
			displayDelimiter.trim()
		])
	).filter((delimiter) => delimiter.length > 0);

	for (const delimiter of displayDelimiters) {
		const delimiterIndex = value.indexOf(delimiter);

		if (delimiterIndex <= 0) continue;

		const key = value.slice(0, delimiterIndex).trim();
		const parsedValue = value
			.slice(delimiterIndex + delimiter.length)
			.trimStart();

		if (!key.length || !parsedValue.length) continue;
		if (delimiter === ':' && parsedValue.startsWith('//')) continue;

		return `${key}${submitDelimiter}${parsedValue}`;
	}

	return value;
};

export const joinKeyValue = (
	key?: string,
	value?: string,
	delimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
) => {
	const finalKey = key ?? '';
	const finalValue = value ?? '';

	if (finalKey && finalValue) return `${finalKey}${delimiter}${finalValue}`;
	if (finalKey) return finalKey;

	return finalValue;
};
