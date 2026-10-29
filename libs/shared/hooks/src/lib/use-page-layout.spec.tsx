/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePageLayout } from '../index';

beforeEach(() => {
	localStorage.clear();
});

describe('usePageLayout', () => {
	it('defaults to full width', () => {
		const { result } = renderHook(() => usePageLayout());

		expect(result.current.layout).toBe('full');
	});

	it('stores the chosen layout and shares it with other callers', () => {
		const { result } = renderHook(() => usePageLayout());
		const { result: other } = renderHook(() => usePageLayout());

		act(() => result.current.setLayout('centered'));

		expect(other.current.layout).toBe('centered');
		expect(localStorage.getItem('page-layout')).toBe('"centered"');
	});

	it('falls back to full width for an unknown stored value', () => {
		localStorage.setItem('page-layout', '"narrow"');
		const { result } = renderHook(() => usePageLayout());

		expect(result.current.layout).toBe('full');
	});
});
