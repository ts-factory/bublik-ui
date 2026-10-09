/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	getCommonPrefix,
	getPathSuggestionLabel,
	getPathSuggestions,
	shouldUseCompactLeafLabel
} from './test-path-combobox.utils';

const testOptions = [
	'../leaf-alpha',
	'suite-a/group-one/node/../leaf-alpha',
	'suite-a/group-two/node/../leaf-alpha',
	'suite-a/group-three/branch-one/../leaf-alpha',
	'suite-a/group-three/branch-two/../leaf-alpha',
	'suite-a/group-three/tool-one/node/../leaf-alpha',
	'suite-a/group-three/tool-two/node/../leaf-alpha',
	'suite-a/group-four/node/../leaf-alpha',
	'../leaf-beta',
	'suite-a/group-one/node/../leaf-beta',
	'suite-a/group-two/node/../leaf-beta',
	'suite-a/group-three/branch-one/../leaf-beta',
	'suite-a/group-three/branch-two/../leaf-beta',
	'suite-a/group-three/tool-one/node/../leaf-beta',
	'suite-a/group-three/tool-two/node/../leaf-beta',
	'suite-a/group-four/node/../leaf-beta'
];

const duplicateLeafOptions = [
	'service-leaf',
	'suite-a/group-one/mode-a/node/service-leaf',
	'suite-a/group-one/mode-b/node/service-leaf',
	'suite-a/other-test'
];

const containsLeafOptions = [
	'alpha-drop-case',
	'suite-a/group-one/node/beta-drop-case',
	'suite-a/group-one/drop-folder/beta-case',
	'suite-a/group-two/node/gamma-case'
];

describe('getPathSuggestions', () => {
	it('shows the first path level for an empty input', () => {
		expect(getPathSuggestions(testOptions, '')).toEqual(['../', 'suite-a/']);
	});

	it('matches only paths that start with the input', () => {
		expect(getPathSuggestions(testOptions, 'suite-')).toEqual(['suite-a/']);
	});

	it('collapses matches to the next slash-separated level', () => {
		expect(getPathSuggestions(testOptions, 'suite-a/group-three/')).toEqual([
			'suite-a/group-three/branch-one/',
			'suite-a/group-three/branch-two/',
			'suite-a/group-three/tool-one/',
			'suite-a/group-three/tool-two/'
		]);
	});

	it('keeps ../ as literal path segments', () => {
		expect(getPathSuggestions(testOptions, '../leaf-')).toEqual([
			'../leaf-alpha',
			'../leaf-beta'
		]);

		expect(
			getPathSuggestions(testOptions, 'suite-a/group-one/node/../leaf-')
		).toEqual([
			'suite-a/group-one/node/../leaf-alpha',
			'suite-a/group-one/node/../leaf-beta'
		]);
	});

	it('deduplicates collapsed suggestions while preserving order', () => {
		expect(getPathSuggestions(testOptions, 'suite-a/')).toEqual([
			'suite-a/group-one/',
			'suite-a/group-two/',
			'suite-a/group-three/',
			'suite-a/group-four/'
		]);
	});

	it('returns leaf paths when no deeper separator remains', () => {
		expect(getPathSuggestions(testOptions, '../leaf-a')).toEqual([
			'../leaf-alpha'
		]);
	});

	it('shows duplicate root leaf matches as distinguishable leaf suggestions', () => {
		expect(getPathSuggestions(duplicateLeafOptions, '')).toEqual([
			'service-leaf',
			'suite-a/group-one/mode-a/node/service-leaf',
			'suite-a/group-one/mode-b/node/service-leaf',
			'suite-a/'
		]);
	});

	it('keeps duplicate root leaf matches visible when typing the leaf name', () => {
		expect(getPathSuggestions(duplicateLeafOptions, 'service')).toEqual([
			'service-leaf',
			'suite-a/group-one/mode-a/node/service-leaf',
			'suite-a/group-one/mode-b/node/service-leaf'
		]);
	});

	it('keeps ancestor folders visible when duplicate leaves have unrelated siblings', () => {
		expect(getPathSuggestions(duplicateLeafOptions, '')).toContain('suite-a/');
	});

	it('searches leaf names by contains at the root level', () => {
		expect(getPathSuggestions(containsLeafOptions, 'drop')).toEqual([
			'alpha-drop-case',
			'suite-a/group-one/node/beta-drop-case'
		]);
	});

	it('keeps slash-level browsing scoped to the current package', () => {
		expect(
			getPathSuggestions(containsLeafOptions, 'suite-a/group-one/')
		).toEqual(['suite-a/group-one/node/', 'suite-a/group-one/drop-folder/']);
		expect(
			getPathSuggestions(containsLeafOptions, 'suite-a/group-one/drop')
		).toEqual(['suite-a/group-one/drop-folder/']);
	});

	it('does not return contains matches from other packages while browsing inside a package', () => {
		expect(
			getPathSuggestions(containsLeafOptions, 'suite-a/group-two/drop')
		).toEqual([]);
	});
});

describe('getCommonPrefix', () => {
	it('returns an empty string for no suggestions', () => {
		expect(getCommonPrefix([])).toBe('');
	});

	it('returns the value for a single suggestion', () => {
		expect(getCommonPrefix(['suite-a/'])).toBe('suite-a/');
	});

	it('returns the shared prefix for multiple suggestions', () => {
		expect(getCommonPrefix(['../leaf-alpha', '../leaf-beta'])).toBe('../leaf-');
	});

	it('returns an empty string when suggestions have no shared prefix', () => {
		expect(getCommonPrefix(['../', 'suite-a/'])).toBe('');
	});
});

describe('getPathSuggestionLabel', () => {
	it('shows the root-level item for an empty input', () => {
		expect(getPathSuggestionLabel('suite-a/', '')).toBe('suite-a/');
	});

	it('shows only the item at the current slash level', () => {
		expect(
			getPathSuggestionLabel(
				'suite-a/group-three/branch-one/',
				'suite-a/group-three/'
			)
		).toBe('branch-one/');
	});

	it('keeps the partial segment in the displayed item', () => {
		expect(getPathSuggestionLabel('suite-a/', 'suite-')).toBe('suite-a/');
	});

	it('shows literal ../ items at their current level', () => {
		expect(getPathSuggestionLabel('../leaf-alpha', '../leaf-')).toBe(
			'leaf-alpha'
		);

		expect(
			getPathSuggestionLabel(
				'suite-a/group-one/node/../leaf-alpha',
				'suite-a/group-one/node/../leaf-'
			)
		).toBe('leaf-alpha');
	});

	it('shortens nested duplicate leaf items with distinguishing context', () => {
		expect(
			getPathSuggestionLabel(
				'suite-a/group-one/mode-a/node/service-leaf',
				'service'
			)
		).toBe('suite-a/../mode-a/../service-leaf');
	});
});

describe('shouldUseCompactLeafLabel', () => {
	it('returns true for nested duplicate leaves shown from root matching', () => {
		expect(
			shouldUseCompactLeafLabel(
				'suite-a/group-one/mode-a/node/service-leaf',
				'service'
			)
		).toBe(true);
	});

	it('returns false for directories and nested browsing', () => {
		expect(shouldUseCompactLeafLabel('suite-a/', '')).toBe(false);
		expect(
			shouldUseCompactLeafLabel(
				'suite-a/group-one/mode-a/node/service-leaf',
				'suite-a/group-one/'
			)
		).toBe(false);
	});
});
