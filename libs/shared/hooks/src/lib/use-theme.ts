/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useLocalStorage } from './useLocalStorage';

const THEMES = ['system', 'light', 'dark'] as const;

type Theme = (typeof THEMES)[number];
type ResolvedTheme = Exclude<Theme, 'system'>;

// Read by the inline script in index.html too: keep the key and the JSON
// encoding in step with it
const THEME_STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const isTheme = (value: unknown): value is Theme =>
	THEMES.includes(value as Theme);

const subscribeToSystemTheme = (onChange: () => void) => {
	const query = window.matchMedia(DARK_QUERY);

	query.addEventListener('change', onChange);

	return () => query.removeEventListener('change', onChange);
};

const getSystemTheme = (): ResolvedTheme =>
	window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';

/**
 * The user's theme choice and the theme it resolves to. Light until the user
 * picks otherwise; `system` follows the OS setting live. The choice is kept in
 * localStorage, so every caller, and every tab, sees the same value without a
 * provider.
 */
function useTheme(): {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
} {
	const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(
		THEME_STORAGE_KEY,
		'light'
	);
	const theme = isTheme(storedTheme) ? storedTheme : 'light';
	const systemTheme = useSyncExternalStore(
		subscribeToSystemTheme,
		getSystemTheme,
		() => 'light' as const
	);
	const setTheme = useCallback(
		(next: Theme) => setStoredTheme(next),
		[setStoredTheme]
	);

	return {
		theme,
		resolvedTheme: theme === 'system' ? systemTheme : theme,
		setTheme
	};
}

/** Puts the resolved theme on `<html>`. Mount once, at the app root. */
function useApplyTheme(): void {
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
	}, [resolvedTheme]);
}

export { useTheme, useApplyTheme, THEMES, THEME_STORAGE_KEY };
export type { Theme, ResolvedTheme };
