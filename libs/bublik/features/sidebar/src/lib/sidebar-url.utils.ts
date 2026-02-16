/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { SIDEBAR_PREFIX } from '@/shared/types';

export function parseModeParam<T extends string>(
	searchParams: URLSearchParams,
	key: string,
	allowedModes: readonly T[]
): T | null {
	const mode = searchParams.get(key);
	if (!mode) {
		return null;
	}

	return allowedModes.includes(mode as T) ? (mode as T) : null;
}

export function setEncodedUrlParam(
	searchParams: URLSearchParams,
	key: string,
	rawUrl: string
): void {
	const cleanedUrl = stripSidebarParamsFromUrl(rawUrl);
	searchParams.set(key, encodeUrlForParam(cleanedUrl));
}

export function getUpdatedSearchParams(
	searchParams: URLSearchParams,
	updater: (newParams: URLSearchParams) => void
): URLSearchParams | null {
	const newParams = new URLSearchParams(searchParams);
	updater(newParams);

	return newParams.toString() === searchParams.toString() ? null : newParams;
}

/**
 * Strips sidebar params from a URL to avoid recursive state growth.
 * Keeps project params.
 */
export function stripSidebarParamsFromUrl(url: string): string {
	if (!url.includes('?')) return url;

	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);

	const keysToRemove: string[] = [];
	params.forEach((_, key) => {
		if (key.startsWith(`${SIDEBAR_PREFIX}.`)) {
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
export function encodeUrlForParam(url: string): string {
	return encodeURIComponent(url);
}

/**
 * Decodes a URL from a URL param.
 */
export function decodeUrlFromParam(encoded: string | null): string | null {
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
export function getBaseUrl(url: string): string {
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
export function addModeToUrl(baseUrl: string, mode: string): string {
	if (!baseUrl.includes('?')) {
		return mode === 'default' ? baseUrl : `${baseUrl}?mode=${mode}`;
	}
	const [pathname, searchStr] = baseUrl.split('?');
	const params = new URLSearchParams(searchStr);
	if (mode === 'default') {
		params.delete('mode');
	} else {
		params.set('mode', mode);
	}
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

/**
 * Generic function to extract ID from URL using a regex pattern.
 */
export function extractIdFromUrl(url: string, pattern: RegExp): string | null {
	const match = url.match(pattern);
	return match ? match[1] : null;
}

/**
 * Extracts runId from a run URL like /runs/86793 or /runs/86793/report
 */
export function extractRunIdFromUrl(url: string): string | null {
	return extractIdFromUrl(url, /\/runs\/(\d+)/);
}

/**
 * Extracts runId from a log URL like /log/86793 or /log/86793?mode=...
 */
export function extractRunIdFromLogUrl(url: string): string | null {
	return extractIdFromUrl(url, /\/log\/(\d+)/);
}
