/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { IssueCategory } from '@/shared/types';

import { CATEGORY_ORDER } from './classification.constants';
import type { IconName } from './classification.tokens';

export type CategoryPresetId = 'attention' | 'explained';

export interface CategoryPreset {
	id: CategoryPresetId;
	label: string;
	description: string;
	iconName: IconName;
	categories: readonly IssueCategory[];
}

/**
 * The two halves a reader triages issues by. One click sets the Category
 * filter to a whole half, where the dropdown would take a pick per category.
 * Together they cover every category exactly once (`assertPresetsPartition`),
 * so a category added later has to be placed in one of them.
 */
export const CATEGORY_PRESETS: readonly CategoryPreset[] = [
	{
		id: 'attention',
		label: 'Actionable',
		description:
			'Issues someone still has to act on: to investigate, product defects and test bugs.',
		iconName: 'TriangleExclamationMark',
		categories: ['to-investigate', 'product-defect', 'test-bug']
	},
	{
		id: 'explained',
		label: 'Triaged',
		description:
			'Issues already accounted for: environment, flaky and known ones.',
		iconName: 'InformationCircleCheckmark',
		categories: ['env', 'flaky', 'known-issue']
	}
];

/** Whether the current Category filter is exactly this preset, in any order. */
export function isPresetActive(
	preset: CategoryPreset,
	selected: readonly string[]
): boolean {
	if (selected.length !== preset.categories.length) return false;

	const current = new Set(selected);

	return preset.categories.every((category) => current.has(category));
}

/**
 * Whether pressing this preset could match anything: at least one of its
 * categories is among `available`, the categories the listed rows carry.
 */
export function isPresetAvailable(
	preset: CategoryPreset,
	available: readonly string[]
): boolean {
	return preset.categories.some((category) => available.includes(category));
}

/**
 * Every category is in exactly one preset. Thrown at module load rather than
 * typed, since a `satisfies` over a union cannot count occurrences.
 */
function assertPresetsPartition(): void {
	const seen = new Map<IssueCategory, CategoryPresetId>();

	for (const preset of CATEGORY_PRESETS) {
		for (const category of preset.categories) {
			const owner = seen.get(category);

			if (owner) {
				throw new Error(
					`Category "${category}" is in both the "${owner}" and "${preset.id}" presets.`
				);
			}

			seen.set(category, preset.id);
		}
	}

	const missing = CATEGORY_ORDER.filter((category) => !seen.has(category));

	if (missing.length) {
		throw new Error(`No category preset covers: ${missing.join(', ')}.`);
	}
}

assertPresetsPartition();
