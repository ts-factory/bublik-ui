/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import {
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	getKeyValueParts
} from './key-value';

export function isWithBracesWithoutNewlines(value: string): boolean {
	return value.includes('{') && !value.includes('\n');
}

/**
 * Single-line values up to this length stay inline even when they contain
 * braces, matching the threshold the old env badge used before collapsing.
 */
const INLINE_BRACED_VALUE_MAX_LENGTH = 30;

/**
 * A value is preformatted when it spans several lines, or when it is a long
 * single line holding a braced structure. Short values such as `a{3}`,
 * `${HOST}` or `{}` read fine inline and are not reformatted.
 */
export function isPreformattedParameterValue(value: string): boolean {
	if (value.includes('\n')) return true;

	return value.length > INLINE_BRACED_VALUE_MAX_LENGTH && /\{.*\}/.test(value);
}

export function isCodeBlock(lines: string[]): boolean {
	// Common code block indicators
	const codePatterns = [
		// Comments
		/^#/,
		/^\/\//,
		/^\/\*/,
		// Control structures
		/\bdo\s*\(/,
		/\brepeat\s*\(/,
		/\bawait\s*\(/,
		/\bif\s*\(/,
		/\bwhile\s*\(/,
		/\bfor\s*\(/,
		// Function calls with parameters
		/\w+\s*\([^)]*\)\s*\.?\w*/,
		// Variable assignments
		/\w+:\w+/,
		// Semicolons at end
		/;\s*$/
	];

	// Check if enough lines match code patterns
	const matchingLines = lines.filter((line) =>
		codePatterns.some((pattern) => pattern.test(line.trim()))
	);

	// Consider it code if more than 30% of non-empty lines match patterns
	const nonEmptyLines = lines.filter((line) => line.trim()).length;
	return matchingLines.length / nonEmptyLines > 0.3;
}

export function formatParameterValue(value: string): string {
	try {
		if (value.includes('\n')) {
			const lines = value.split('\n');

			if (isCodeBlock(lines)) return value;

			let indentLevel = 0;
			return lines
				.map((line) => {
					const trimmed = line.trim();
					if (!trimmed) return '';

					if (trimmed.startsWith('}') || trimmed.startsWith('],')) {
						indentLevel--;
					}

					const indent = '  '.repeat(Math.max(0, indentLevel));

					if (
						trimmed.endsWith('{') ||
						trimmed.endsWith('[') ||
						trimmed.endsWith(':{')
					) {
						indentLevel++;
					}

					return indent + trimmed;
				})
				.filter(Boolean)
				.join('\n');
		}

		if (isWithBracesWithoutNewlines(value)) {
			let indentLevel = 0;
			const indent = '  ';
			let result = '';
			let inString = false;

			for (let i = 0; i < value.length; i++) {
				const char = value[i];

				if (char === '"' || char === "'") {
					inString = !inString;
				}

				if (!inString) {
					if (char === '{' || char === '[') {
						result += char + '\n' + indent.repeat(++indentLevel);
						continue;
					}
					if (char === '}' || char === ']') {
						result += '\n' + indent.repeat(--indentLevel) + char;
						continue;
					}
					if (char === ',') {
						result += char + '\n' + indent.repeat(indentLevel);
						continue;
					}
				}

				result += char;
			}

			return result;
		}

		return value;
	} catch (error) {
		return value;
	}
}

const PARAMETER_LABEL_MAX_LENGTH = 80;

/**
 * Squashes a parameter onto one line for places that can only show a short
 * label, such as filter options: whitespace runs collapse to a single space
 * and the result is cut with an ellipsis past `maxLength` characters.
 */
export function toSingleLineParameterLabel(
	label: string,
	maxLength = PARAMETER_LABEL_MAX_LENGTH
): string {
	const singleLine = label.replace(/\s+/g, ' ').trim();

	if (singleLine.length <= maxLength) return singleLine;

	return `${singleLine.slice(0, maxLength - 1)}…`;
}

export interface ParsedParameter {
	name: string;
	value: string;
	isPreformatted: boolean;
}

export const parseParameter = (
	raw: string,
	submitDelimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
): ParsedParameter => {
	const [name, parsedValue] = getKeyValueParts(raw, submitDelimiter);
	const value = parsedValue ?? '';

	return { name, value, isPreformatted: isPreformattedParameterValue(value) };
};
