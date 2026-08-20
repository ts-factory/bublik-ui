/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import {
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	getKeyValueParts
} from './key-value';

export function isWithBracesWithoutNewlines(value: string): boolean {
	return value.includes('{') && !value.includes('\n');
}

export function isPreformattedParameterValue(value: string): boolean {
	return isWithBracesWithoutNewlines(value) || value.includes('\n');
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

export interface ParsedParameter {
	name: string;
	value: string;
	isPreformatted: boolean;
	formattedValue: string;
}

export const parseParameter = (
	raw: string,
	submitDelimiter = DEFAULT_KEY_VALUE_SUBMIT_DELIMITER
): ParsedParameter => {
	const [name, parsedValue] = getKeyValueParts(raw, submitDelimiter);
	const value = parsedValue ?? '';
	const isPreformatted = isPreformattedParameterValue(value);

	return {
		name,
		value,
		isPreformatted,
		formattedValue: isPreformatted ? formatParameterValue(value) : value
	};
};
