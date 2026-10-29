/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import { useLocalStorage } from './useLocalStorage';

const PAGE_LAYOUTS = ['full', 'sidebar-left', 'centered'] as const;

type PageLayout = (typeof PAGE_LAYOUTS)[number];

const PAGE_LAYOUT_STORAGE_KEY = 'page-layout';

const isPageLayout = (value: unknown): value is PageLayout =>
	PAGE_LAYOUTS.includes(value as PageLayout);

/**
 * How pages sit on wide screens: across the whole width (the default), capped
 * beside a sidebar at the left edge, or capped and centered together with the
 * sidebar. Kept in localStorage, so every caller, and every tab, sees the
 * same value without a provider.
 */
function usePageLayout(): {
	layout: PageLayout;
	setLayout: (layout: PageLayout) => void;
} {
	const [storedLayout, setStoredLayout] = useLocalStorage<PageLayout>(
		PAGE_LAYOUT_STORAGE_KEY,
		'full'
	);
	const setLayout = useCallback(
		(next: PageLayout) => setStoredLayout(next),
		[setStoredLayout]
	);

	return {
		layout: isPageLayout(storedLayout) ? storedLayout : 'full',
		setLayout
	};
}

export { usePageLayout, PAGE_LAYOUTS, PAGE_LAYOUT_STORAGE_KEY };
export type { PageLayout };
