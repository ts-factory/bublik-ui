/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	CHAT_SIDEBAR_KEYS,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

const CHAT_DEFAULT_URL = '/chat';

interface UseChatSidebarStateReturn {
	mainLinkUrl: string;
	setLastUrl: (url: string) => void;
}

function useChatSidebarState(): UseChatSidebarStateReturn {
	const [searchParams] = useSearchParams();
	const writeSidebarState = useSidebarStateWriter();

	const mainLinkUrl = useMemo(
		() =>
			getSidebarStateString(searchParams, CHAT_SIDEBAR_KEYS.LAST_URL) ||
			CHAT_DEFAULT_URL,
		[searchParams]
	);

	const setLastUrl = useCallback(
		(url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(
					sidebarState,
					CHAT_SIDEBAR_KEYS.LAST_URL,
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return { mainLinkUrl, setLastUrl };
}

export { useChatSidebarState };
export type { UseChatSidebarStateReturn };
