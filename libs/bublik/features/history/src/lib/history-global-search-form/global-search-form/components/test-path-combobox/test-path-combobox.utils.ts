/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

function getPathSuggestion(option: string, input: string): string | null {
	const levelStartIndex = input.lastIndexOf('/') + 1;
	const basePrefix = input.slice(0, levelStartIndex);
	const query = input.slice(levelStartIndex);

	if (!option.startsWith(basePrefix)) {
		return null;
	}

	const nextSeparatorIndex = option.indexOf('/', basePrefix.length);
	const suggestion =
		nextSeparatorIndex === -1
			? option
			: option.slice(0, nextSeparatorIndex + 1);
	const suggestionName = suggestion.slice(basePrefix.length);

	if (query && !suggestionName.includes(query)) {
		return null;
	}

	return suggestion;
}

function getLeafName(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1);
}

function getRootDuplicateLeafOptions(
	options: string[],
	input: string
): Set<string> {
	const duplicateLeafOptions = new Set<string>();

	if (input.includes('/')) {
		return duplicateLeafOptions;
	}

	const rootLeafNames = new Set(
		options
			.filter((option) => !option.includes('/'))
			.filter((option) => option.startsWith(input))
	);

	for (const rootLeafName of rootLeafNames) {
		const matchingOptions = options.filter(
			(option) => getLeafName(option) === rootLeafName
		);

		if (matchingOptions.length <= 1) {
			continue;
		}

		for (const option of matchingOptions) {
			duplicateLeafOptions.add(option);
		}
	}

	return duplicateLeafOptions;
}

function getContainsLeafOptions(options: string[], input: string): Set<string> {
	const containsLeafOptions = new Set<string>();

	if (!input || input.includes('/')) {
		return containsLeafOptions;
	}

	for (const option of options) {
		const leafName = getLeafName(option);

		if (!option.startsWith(input) && leafName.includes(input)) {
			containsLeafOptions.add(option);
		}
	}

	return containsLeafOptions;
}

function getPathSuggestions(options: string[], input: string): string[] {
	const suggestions = new Set<string>();
	const duplicateLeafOptions = getRootDuplicateLeafOptions(options, input);
	const containsLeafOptions = getContainsLeafOptions(options, input);

	for (const option of options) {
		if (duplicateLeafOptions.has(option) || containsLeafOptions.has(option)) {
			suggestions.add(option);
			continue;
		}

		const suggestion = getPathSuggestion(option, input);

		if (suggestion) {
			suggestions.add(suggestion);
		}
	}

	return Array.from(suggestions);
}

function getPathSuggestionLabel(suggestion: string, input: string): string {
	if (shouldUseCompactLeafLabel(suggestion, input)) {
		return getCompactLeafLabel(suggestion);
	}

	const levelStartIndex = input.lastIndexOf('/') + 1;

	return suggestion.slice(levelStartIndex);
}

function shouldUseCompactLeafLabel(suggestion: string, input: string): boolean {
	return (
		!suggestion.endsWith('/') &&
		!input.includes('/') &&
		suggestion.includes('/')
	);
}

function getCompactLeafLabel(suggestion: string): string {
	const parts = suggestion.split('/');

	if (parts.length <= 2) {
		return suggestion;
	}

	const leaf = parts.at(-1);
	const contextParts = parts.slice(0, -1);
	const first = contextParts[0];
	let distinguishingPart: string | undefined;

	for (let index = contextParts.length - 2; index >= 0; index -= 1) {
		const part = contextParts[index];

		if (part !== '..') {
			distinguishingPart = part;
			break;
		}
	}

	if (!leaf || !distinguishingPart || distinguishingPart === first) {
		return `${first}/../${leaf}`;
	}

	return `${first}/../${distinguishingPart}/../${leaf}`;
}

function getCommonPrefix(values: string[]): string {
	if (values.length === 0) {
		return '';
	}

	let prefix = values[0];

	for (const value of values.slice(1)) {
		while (prefix && !value.startsWith(prefix)) {
			prefix = prefix.slice(0, -1);
		}

		if (!prefix) {
			break;
		}
	}

	return prefix;
}

export {
	getCommonPrefix,
	getPathSuggestionLabel,
	getPathSuggestions,
	shouldUseCompactLeafLabel
};
