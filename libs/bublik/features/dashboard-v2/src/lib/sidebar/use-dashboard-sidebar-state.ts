/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
	DASHBOARD_SIDEBAR_KEYS,
	decodeUrlFromParam,
	setEncodedUrlParam,
	getUpdatedSearchParams
} from '@/bublik/features/sidebar';

export interface UseDashboardSidebarStateReturn {
	lastUrl: string | null;
	mainLinkUrl: string;
	setLastUrl: (url: string) => void;
}

export function useDashboardSidebarState(): UseDashboardSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

	const lastUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(DASHBOARD_SIDEBAR_KEYS.LAST_URL)),
		[searchParams]
	);

	const mainLinkUrl = useMemo(() => {
		return lastUrl || '/dashboard';
	}, [lastUrl]);

	const setLastUrl = useCallback(
		(url: string) => {
			const currentSearchParams = new URLSearchParams(window.location.search);

			const newParams = getUpdatedSearchParams(
				currentSearchParams,
				(nextParams) => {
					setEncodedUrlParam(nextParams, DASHBOARD_SIDEBAR_KEYS.LAST_URL, url);
				}
			);

			if (!newParams) {
				return;
			}

			setSearchParams(newParams, {
				replace: true,
				state: location.state
			});
		},
		[location.state, setSearchParams]
	);

	return {
		lastUrl,
		mainLinkUrl,
		setLastUrl
	};
}
