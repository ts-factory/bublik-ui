/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useApplyTheme, useTheme } from '../index';

let systemDark = false;
const listeners = new Set<() => void>();

const setSystemDark = (dark: boolean) => {
	systemDark = dark;
	listeners.forEach((listener) => listener());
};

beforeEach(() => {
	systemDark = false;
	listeners.clear();
	localStorage.clear();
	document.documentElement.classList.remove('dark');
	vi.stubGlobal('matchMedia', (query: string) => ({
		get matches() {
			return query.includes('dark') && systemDark;
		},
		addEventListener: (_: string, listener: () => void) =>
			listeners.add(listener),
		removeEventListener: (_: string, listener: () => void) =>
			listeners.delete(listener)
	}));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('useTheme', () => {
	it('defaults to light whatever the OS setting', () => {
		setSystemDark(true);
		const { result } = renderHook(() => useTheme());

		expect(result.current.theme).toBe('light');
		expect(result.current.resolvedTheme).toBe('light');
	});

	it('follows the OS setting live once system is chosen', () => {
		const { result } = renderHook(() => useTheme());

		act(() => result.current.setTheme('system'));

		expect(result.current.resolvedTheme).toBe('light');

		act(() => setSystemDark(true));

		expect(result.current.resolvedTheme).toBe('dark');
	});

	it('lets an explicit choice override the OS setting and stores it', () => {
		setSystemDark(true);
		const { result } = renderHook(() => useTheme());

		act(() => result.current.setTheme('light'));

		expect(result.current.theme).toBe('light');
		expect(result.current.resolvedTheme).toBe('light');
		expect(localStorage.getItem('theme')).toBe('"light"');
	});

	it('falls back to light for an unknown stored value', () => {
		localStorage.setItem('theme', '"sepia"');
		const { result } = renderHook(() => useTheme());

		expect(result.current.theme).toBe('light');
	});
});

describe('useApplyTheme', () => {
	it('puts the resolved theme on <html>', () => {
		renderHook(() => useApplyTheme());
		const { result } = renderHook(() => useTheme());

		expect(document.documentElement.classList.contains('dark')).toBe(false);

		act(() => result.current.setTheme('dark'));

		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});
});
