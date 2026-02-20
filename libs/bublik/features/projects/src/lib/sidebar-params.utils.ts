/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createPath, parsePath } from 'react-router-dom';

import { SIDEBAR_PREFIX } from '@/shared/types';

import { PROJECT_KEY } from '../constants';

/**
 * Preserves sidebar state params from current URL into target params.
 * Rules:
 * - Preserve all params starting with `sidebar.`
 * - Don't append if the key already exists in target params (allow explicit overrides)
 * - Add project IDs
 */
export function mergeParamsWithSidebarState(
	targetParams: URLSearchParams,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): URLSearchParams {
	const result = new URLSearchParams(targetParams);

	const keysToPreserve: string[] = [];
	currentSearchParams.forEach((_, key) => {
		if (key.startsWith(`${SIDEBAR_PREFIX}.`) && !keysToPreserve.includes(key)) {
			keysToPreserve.push(key);
		}
	});

	keysToPreserve.forEach((key) => {
		if (!result.has(key)) {
			const values = currentSearchParams.getAll(key);
			values.forEach((value) => result.append(key, value));
		}
	});

	result.delete(PROJECT_KEY);
	projectIds.forEach((id) => result.append(PROJECT_KEY, id.toString()));

	return result;
}

export function mergeStringUrlWithSidebarState(
	to: string,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): string {
	const parsed = parsePath(to);
	const targetParams = new URLSearchParams(parsed.search || '');
	const mergedParams = mergeParamsWithSidebarState(
		targetParams,
		currentSearchParams,
		projectIds
	);

	const mergedSearch = mergedParams.toString();

	return createPath({
		pathname: parsed.pathname ?? '',
		search: mergedSearch ? `?${mergedSearch}` : '',
		hash: parsed.hash
	});
}
