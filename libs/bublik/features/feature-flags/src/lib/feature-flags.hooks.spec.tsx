/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
	FEATURE_FLAGS_SEEN_STORAGE_KEY,
	FEATURE_FLAGS_STORAGE_KEY,
	useFeatureFlag,
	useFeatureFlags,
	useSeenFeatureFlags
} from '../index';

beforeEach(() => localStorage.clear());

describe('useFeatureFlags', () => {
	it('has every flag off until the user turns it on', () => {
		const { result } = renderHook(() => useFeatureFlags());

		expect(result.current.flags).toEqual({ 'dashboard-grid': false });
		expect(result.current.isEnabled('dashboard-grid')).toBe(false);
	});

	it('stores a switched flag and shares it with other callers', () => {
		const { result } = renderHook(() => useFeatureFlags());
		const { result: single } = renderHook(() =>
			useFeatureFlag('dashboard-grid')
		);

		act(() => result.current.setFlag('dashboard-grid', true));

		expect(result.current.isEnabled('dashboard-grid')).toBe(true);
		expect(single.current[0]).toBe(true);
		expect(localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)).toBe(
			'{"dashboard-grid":true}'
		);
	});

	it('ignores unknown and malformed stored entries', () => {
		localStorage.setItem(
			FEATURE_FLAGS_STORAGE_KEY,
			'{"dashboard-grid":"yes","retired-flag":true}'
		);
		const { result } = renderHook(() => useFeatureFlags());

		expect(result.current.flags).toEqual({ 'dashboard-grid': false });

		act(() => result.current.setFlag('dashboard-grid', true));

		expect(localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)).toBe(
			'{"dashboard-grid":true}'
		);
	});

	it('resets every flag', () => {
		const { result } = renderHook(() => useFeatureFlag('dashboard-grid'));
		const { result: all } = renderHook(() => useFeatureFlags());

		act(() => result.current[1](true));
		expect(result.current[0]).toBe(true);

		act(() => all.current.resetFlags());
		expect(result.current[0]).toBe(false);
	});
});

describe('useSeenFeatureFlags', () => {
	it('has nothing seen at first', () => {
		const { result } = renderHook(() => useSeenFeatureFlags());

		expect(result.current.isSeen('dashboard-grid')).toBe(false);
	});

	it('remembers flags marked seen and drops unknown stored ids', () => {
		localStorage.setItem(FEATURE_FLAGS_SEEN_STORAGE_KEY, '["retired-flag"]');
		const { result } = renderHook(() => useSeenFeatureFlags());

		act(() => result.current.markSeen(['dashboard-grid']));

		expect(result.current.isSeen('dashboard-grid')).toBe(true);
		expect(localStorage.getItem(FEATURE_FLAGS_SEEN_STORAGE_KEY)).toBe(
			'["dashboard-grid"]'
		);
	});

	it('counts switching a flag as seeing it', () => {
		const { result: seen } = renderHook(() => useSeenFeatureFlags());
		const { result } = renderHook(() => useFeatureFlag('dashboard-grid'));

		act(() => result.current[1](true));

		expect(seen.current.isSeen('dashboard-grid')).toBe(true);
	});
});
