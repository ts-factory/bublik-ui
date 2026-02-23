/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { config } from '@/bublik/config';
import { getKeyValueParts } from '@/shared/utils';

const toKeyValueMap = (items: string[], delimiter: string) => {
	const entries = items
		.map((item) => getKeyValueParts(item, delimiter))
		.filter(
			(entry): entry is [string, string] => typeof entry[1] !== 'undefined'
		);

	return new Map(entries);
};

export function calculateGroupSize(
	dataset: string[][],
	maxMismatchCount: number
) {
	const referenceSet = dataset[0];
	const referenceMap = toKeyValueMap(
		referenceSet,
		config.keyValueSubmitDelimiter
	);

	let groupSize = 1;

	for (let i = 1; i < dataset.length; i++) {
		const currentSet = dataset[i];
		const currentSetMap = toKeyValueMap(
			currentSet,
			config.keyValueSubmitDelimiter
		);

		let mismatchCount = 0;

		for (const [key, value] of referenceMap) {
			if (currentSetMap.get(key) !== value) {
				mismatchCount++;
				if (mismatchCount >= maxMismatchCount) {
					groupSize = i;
					return groupSize;
				}
			}
		}
	}

	return groupSize;
}

export function getCommonParameters(allParameters: string[][]): Set<string> {
	const comparableRows = allParameters.filter(
		(parameters) => parameters.length > 0
	);

	if (comparableRows.length < 2) return new Set();

	// Start with all parameters from the first comparable row
	const commonSet = new Set(comparableRows[0]);

	// Intersect with each subsequent row
	for (let i = 1; i < comparableRows.length; i++) {
		const currentSet = new Set(comparableRows[i]);
		// Collect items to delete first, then remove them after iteration
		const toDelete: string[] = [];
		for (const param of commonSet) {
			if (!currentSet.has(param)) {
				toDelete.push(param);
			}
		}
		for (const param of toDelete) {
			commonSet.delete(param);
		}
	}

	return commonSet;
}

export type DiffValue = {
	value: string;
	isDifferent?: boolean;
};

export function highlightDifferences(
	current: string[],
	reference: string[],
	delimeter = config.keyValueSubmitDelimiter
): DiffValue[] {
	const referenceMap = toKeyValueMap(reference, delimeter);

	return current.map((item) => {
		const [currentKey, currentValue] = getKeyValueParts(item, delimeter);
		const referenceValue = referenceMap.get(currentKey);

		if (typeof currentValue === 'undefined') return { value: item };
		if (typeof referenceValue === 'undefined') return { value: item };

		if (currentValue !== referenceValue) {
			return { value: item, isDifferent: true };
		}
		return { value: item };
	});
}
