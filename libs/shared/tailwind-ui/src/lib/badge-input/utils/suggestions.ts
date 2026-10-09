/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	formatKeyValueForDisplay,
	normalizeKeyValueForSubmit
} from '@/shared/utils';

/** How many suggestions the list renders at once; typing narrows the rest. */
const DEFAULT_SUGGESTION_LIMIT = 100;

interface FilterBadgeSuggestionsOptions {
	displayDelimiter?: string;
	submitDelimiter?: string;
	limit?: number;
}

interface FilteredBadgeSuggestions {
	/** The matches to show, those starting with the input first. */
	items: string[];
	/** Every match, including the ones past the limit. */
	total: number;
}

/**
 * The suggestions matching what is typed, case-insensitively and anywhere in
 * the value. Suggestions are in the submit form (`name=value`), and the input
 * is matched against that and against the displayed form (`name: value`), so
 * typing either finds the value.
 */
function filterBadgeSuggestions(
	suggestions: readonly string[],
	input: string,
	options: FilterBadgeSuggestionsOptions = {}
): FilteredBadgeSuggestions {
	const {
		displayDelimiter,
		submitDelimiter,
		limit = DEFAULT_SUGGESTION_LIMIT
	} = options;
	const delimiters = { displayDelimiter, submitDelimiter };
	const query = input.trim().toLowerCase();
	const submitQuery = normalizeKeyValueForSubmit(
		input,
		delimiters
	).toLowerCase();
	const seen = new Set<string>();
	const prefixed: string[] = [];
	const contained: string[] = [];

	for (const suggestion of suggestions) {
		if (seen.has(suggestion)) continue;
		seen.add(suggestion);

		if (!query) {
			prefixed.push(suggestion);
			continue;
		}

		const submitForm = suggestion.toLowerCase();
		const displayForm = formatKeyValueForDisplay(
			suggestion,
			delimiters
		).toLowerCase();

		if (submitForm.startsWith(submitQuery) || displayForm.startsWith(query)) {
			prefixed.push(suggestion);
		} else if (
			submitForm.includes(submitQuery) ||
			displayForm.includes(query)
		) {
			contained.push(suggestion);
		}
	}

	const matches = [...prefixed, ...contained];

	return { items: matches.slice(0, limit), total: matches.length };
}

export { filterBadgeSuggestions, DEFAULT_SUGGESTION_LIMIT };
export type { FilterBadgeSuggestionsOptions, FilteredBadgeSuggestions };
