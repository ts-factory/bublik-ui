/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { linkOptions } from '@tanstack/react-router';
import { useRenderedLocation } from '@/router';

import {
	DASHBOARD_SIDEBAR_KEYS,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

/** Where an item points before a page of its own was visited. */
const DASHBOARD = linkOptions({ to: '/dashboard' }).to;

export interface UseDashboardSidebarStateReturn {
	lastUrl: string | null;
	mainLinkUrl: string;
	setLastUrl: (url: string) => void;
}

export function useDashboardSidebarState(): UseDashboardSidebarStateReturn {
	const { searchStr } = useRenderedLocation();
	const writeSidebarState = useSidebarStateWriter();

	const lastUrl = useMemo(
		() =>
			getSidebarStateString(
				new URLSearchParams(searchStr),
				DASHBOARD_SIDEBAR_KEYS.LAST_URL
			),
		[searchStr]
	);

	const mainLinkUrl = useMemo(() => {
		return lastUrl || DASHBOARD;
	}, [lastUrl]);

	const setLastUrl = useCallback(
		(url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(
					sidebarState,
					DASHBOARD_SIDEBAR_KEYS.LAST_URL,
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return {
		lastUrl,
		mainLinkUrl,
		setLastUrl
	};
}
