/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	LOG_SIDEBAR_KEYS,
	LogSidebarMode,
	SHARED_SIDEBAR_KEYS
} from '@/bublik/features/sidebar';

export interface UseLogSidebarStateReturn {
	// Last visited log page URL
	lastLogUrl: string | null;
	lastMode: LogSidebarMode | null;

	// Current run context from shared state
	currentRunId: string | null;

	// Whether log page is available (visited log OR has run context)
	isAvailable: boolean;

	// Get URL for a specific mode
	getModeUrl: (mode: LogSidebarMode) => string;
	mainLinkUrl: string;

	// Update last visited state
	setLastVisited: (mode: LogSidebarMode, url: string, runId?: string) => void;
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
 * Encodes a URL for storage in a URL param.
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

/**
 * Gets base URL without mode parameter.
 */
function getBaseUrl(url: string): string {
	if (!url.includes('?')) return url;
	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);
	params.delete('mode');
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

/**
 * Adds mode parameter to URL.
 */
function addModeToUrl(baseUrl: string, mode: LogSidebarMode): string {
	if (!baseUrl.includes('?')) {
		return mode === 'treeAndinfoAndlog' ? baseUrl : `${baseUrl}?mode=${mode}`;
	}
	const [pathname, searchStr] = baseUrl.split('?');
	const params = new URLSearchParams(searchStr);
	if (mode === 'treeAndinfoAndlog') {
		params.delete('mode');
	} else {
		params.set('mode', mode);
	}
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

/**
 * Extracts runId from a log URL like /log/86793 or /log/86793?mode=...
 */
function extractRunIdFromLogUrl(url: string): string | null {
	const match = url.match(/\/log\/(\d+)/);
	return match ? match[1] : null;
}

export function useLogSidebarState(): UseLogSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	const lastLogUrl = useMemo(
		() =>
			decodeUrlFromParam(
				searchParams.get(LOG_SIDEBAR_KEYS.LAST_LOG)
			),
		[searchParams]
	);

	const lastMode = useMemo<LogSidebarMode | null>(() => {
		const mode = searchParams.get(LOG_SIDEBAR_KEYS.LAST_MODE);
		if (
			mode === 'log' ||
			mode === 'infoAndlog' ||
			mode === 'treeAndinfoAndlog' ||
			mode === 'treeAndlog'
		) {
			return mode;
		}
		return null;
	}, [searchParams]);

	const currentRunId = useMemo(
		() => searchParams.get(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID),
		[searchParams]
	);

	// Available if we have a last log URL OR a current run context
	const isAvailable = !!(lastLogUrl || currentRunId);

	const getModeUrl = useCallback(
		(mode: LogSidebarMode): string => {
			if (lastLogUrl) {
				const baseUrl = getBaseUrl(lastLogUrl);
				return addModeToUrl(baseUrl, mode);
			}
			// If no last log URL but we have a current runId, construct URL
			if (currentRunId) {
				return mode === 'log'
					? `/log/${currentRunId}`
					: `/log/${currentRunId}?mode=${mode}`;
			}
			return '/log';
		},
		[lastLogUrl, currentRunId]
	);

	const mainLinkUrl = useMemo(() => {
		if (lastLogUrl) {
			return getModeUrl(lastMode || 'treeAndinfoAndlog');
		}
		if (currentRunId) {
			return getModeUrl(lastMode || 'treeAndinfoAndlog');
		}
		return '/log';
	}, [lastLogUrl, currentRunId, lastMode, getModeUrl]);

	const setLastVisited = useCallback(
		(mode: LogSidebarMode, url: string, runId?: string) => {
			const newParams = new URLSearchParams(searchParams);

			newParams.set(LOG_SIDEBAR_KEYS.LAST_MODE, mode);

			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const encodedUrl = encodeUrlForParam(cleanedUrl);

			newParams.set(LOG_SIDEBAR_KEYS.LAST_LOG, encodedUrl);

			// Update shared run context
			const extractedRunId = runId || extractRunIdFromLogUrl(url);
			if (extractedRunId) {
				newParams.set(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID, extractedRunId);
				newParams.set(SHARED_SIDEBAR_KEYS.LAST_LOG_RUN_ID, extractedRunId);
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return {
		lastLogUrl,
		lastMode,
		currentRunId,
		isAvailable,
		getModeUrl,
		mainLinkUrl,
		setLastVisited
	};
}
