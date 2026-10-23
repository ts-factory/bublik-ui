/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

/**
 * Every experimental feature a user can switch on from Settings → Beta.
 *
 * A flag is off until the user turns it on. Adding an entry here is all it
 * takes to get a switch in the Beta tab; gate the feature with
 * `useFeatureFlag(id)` or `<FeatureGate flag={id}>`. Remove the entry once
 * the feature ships for everyone; a stale stored value is ignored.
 */
export const FEATURE_FLAGS = [
	{
		id: 'dashboard-grid',
		name: 'Dashboard Grid Layout',
		isNew: true,
		description:
			'Lay the dashboard table out as a grid: numbers right-aligned, header text aligned with badge text, and columns sized by their content so long names keep room when the window is narrow.'
	}
] as const satisfies readonly FeatureFlagDefinition[];

export interface FeatureFlagDefinition {
	id: string;
	name: string;
	description: string;
	/**
	 * Added recently: the account menu's Beta flyout tags it NEW until the
	 * user has seen it there, or switched it.
	 */
	isNew?: boolean;
}

export type FeatureFlagId = (typeof FEATURE_FLAGS)[number]['id'];

export type FeatureFlagsState = Partial<Record<FeatureFlagId, boolean>>;

export const FEATURE_FLAGS_STORAGE_KEY = 'feature-flags';

/** The flags whose NEW tag the user has already seen. */
export const FEATURE_FLAGS_SEEN_STORAGE_KEY = 'feature-flags-seen';

export const isFeatureFlagId = (value: unknown): value is FeatureFlagId =>
	FEATURE_FLAGS.some((flag) => flag.id === value);
