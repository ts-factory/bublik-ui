/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DASHBOARD_SIDEBAR_KEYS } from '@/bublik/features/sidebar';

export interface UseDashboardSidebarStateReturn {
	// Last visited URL (decoded from URL params)
	lastUrl: string | null;

	// Computed URL for navigation
	mainLinkUrl: string;

	// Update last visited state
	setLastUrl: (url: string) => void;
}

/**
 * Strips sidebar.* params from a URL to avoid recursive state growth.
 * Keeps project params.
 */
function stripSidebarParamsFromUrl(url: string): string {
	if (!url.includes('?')) return url;

	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);

	// Remove all sidebar.* params
	const keysToRemove: string[] = [];
	params.forEach((_, key) => {
		if (key.startsWith('sidebar.')) {
			keysToRemove.push(key);
		}
	});
	keysToRemove.forEach((key) => params.delete(key));

	const cleanedSearch = params.toString();
	return cleanedSearch ? `${pathname}?${cleanedSearch}` : pathname;
}

/**
 * Encodes a URL for storage in a URL param (URL-encode the path and query).
 */
function encodeUrlForParam(url: string): string {
	return encodeURIComponent(url);
}

/**
 * Decodes a URL from a URL param.
 */
function decodeUrlFromParam(encoded: string | null): string | null {
	if (!encoded) return null;
	try {
		return decodeURIComponent(encoded);
	} catch {
		return null;
	}
}

export function useDashboardSidebarState(): UseDashboardSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	const lastUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(DASHBOARD_SIDEBAR_KEYS.LAST_URL)),
		[searchParams]
	);

	const mainLinkUrl = useMemo(() => {
		return lastUrl || '/dashboard';
	}, [lastUrl]);

	const setLastUrl = useCallback(
		(url: string) => {
			const newParams = new URLSearchParams(searchParams);

			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const encodedUrl = encodeUrlForParam(cleanedUrl);

			newParams.set(DASHBOARD_SIDEBAR_KEYS.LAST_URL, encodedUrl);

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return {
		lastUrl,
		mainLinkUrl,
		setLastUrl
	};
}
