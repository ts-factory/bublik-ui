/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useMemo } from 'react';

import { useLocalStorage } from '@/shared/hooks';

import {
	FEATURE_FLAGS,
	FEATURE_FLAGS_SEEN_STORAGE_KEY,
	FEATURE_FLAGS_STORAGE_KEY,
	FeatureFlagId,
	FeatureFlagsState,
	isFeatureFlagId
} from './feature-flags.registry';

// A stable reference: `useLocalStorage` keys its snapshot on the initial value.
const NO_FLAGS: FeatureFlagsState = {};

/** Keeps only known flags with boolean values, so a stale or hand-edited entry is ignored. */
const sanitize = (stored: unknown): FeatureFlagsState => {
	if (!stored || typeof stored !== 'object') return NO_FLAGS;

	const result: FeatureFlagsState = {};

	for (const [key, value] of Object.entries(stored)) {
		if (isFeatureFlagId(key) && typeof value === 'boolean') result[key] = value;
	}

	return result;
};

const NO_SEEN: readonly FeatureFlagId[] = [];

const sanitizeSeen = (stored: unknown): readonly FeatureFlagId[] =>
	Array.isArray(stored) ? stored.filter(isFeatureFlagId) : NO_SEEN;

/**
 * Which flags' NEW tag the user has already seen, kept in localStorage like
 * the flags themselves. Unknown ids are dropped, as with the flags.
 */
function useSeenFeatureFlags(): {
	isSeen: (id: FeatureFlagId) => boolean;
	markSeen: (ids: readonly FeatureFlagId[]) => void;
} {
	const [stored, setStored] = useLocalStorage<readonly FeatureFlagId[]>(
		FEATURE_FLAGS_SEEN_STORAGE_KEY,
		NO_SEEN
	);

	const seen = useMemo(() => new Set(sanitizeSeen(stored)), [stored]);

	const isSeen = useCallback((id: FeatureFlagId) => seen.has(id), [seen]);

	const markSeen = useCallback(
		(ids: readonly FeatureFlagId[]) => {
			if (!ids.length) return;

			setStored((previous) => [
				...new Set([...sanitizeSeen(previous), ...ids])
			]);
		},
		[setStored]
	);

	return { isSeen, markSeen };
}

/**
 * All feature flags and their switches. The state lives in localStorage, so
 * every caller, and every tab, sees the same value without a provider.
 */
function useFeatureFlags(): {
	flags: Record<FeatureFlagId, boolean>;
	isEnabled: (id: FeatureFlagId) => boolean;
	setFlag: (id: FeatureFlagId, enabled: boolean) => void;
	resetFlags: () => void;
} {
	const [stored, setStored] = useLocalStorage<FeatureFlagsState>(
		FEATURE_FLAGS_STORAGE_KEY,
		NO_FLAGS
	);
	const { markSeen } = useSeenFeatureFlags();

	const flags = useMemo(() => {
		const known = sanitize(stored);

		return Object.fromEntries(
			FEATURE_FLAGS.map((flag) => [flag.id, known[flag.id] ?? false])
		) as Record<FeatureFlagId, boolean>;
	}, [stored]);

	const isEnabled = useCallback((id: FeatureFlagId) => flags[id], [flags]);

	// Switching a flag, anywhere, counts as having seen it.
	const setFlag = useCallback(
		(id: FeatureFlagId, enabled: boolean) => {
			setStored((previous) => ({ ...sanitize(previous), [id]: enabled }));
			markSeen([id]);
		},
		[setStored, markSeen]
	);

	const resetFlags = useCallback(() => setStored(NO_FLAGS), [setStored]);

	return { flags, isEnabled, setFlag, resetFlags };
}

/** One flag: whether it is on, and a setter for it. */
function useFeatureFlag(
	id: FeatureFlagId
): [enabled: boolean, setEnabled: (enabled: boolean) => void] {
	const { flags, setFlag } = useFeatureFlags();
	const setEnabled = useCallback(
		(enabled: boolean) => setFlag(id, enabled),
		[id, setFlag]
	);

	return [flags[id], setEnabled];
}

export { useFeatureFlags, useFeatureFlag, useSeenFeatureFlags };
