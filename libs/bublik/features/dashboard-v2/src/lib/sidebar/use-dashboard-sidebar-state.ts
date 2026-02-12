/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	DASHBOARD_SIDEBAR_KEYS,
	decodeUrlFromParam,
	encodeUrlForParam,
	stripSidebarParamsFromUrl
} from '@/bublik/features/sidebar';

export interface UseDashboardSidebarStateReturn {
	// Last visited URL (decoded from URL params)
	lastUrl: string | null;

	// Computed URL for navigation
	mainLinkUrl: string;

	// Update last visited state
	setLastUrl: (url: string) => void;
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
