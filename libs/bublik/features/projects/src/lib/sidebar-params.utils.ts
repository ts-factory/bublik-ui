/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { resolveTo, splitTarget, type ResolvedTo, type To } from '@/router';

import { SIDEBAR_STATE_PARAM } from '@/shared/types';

import { HIDE_SIDEBAR_QUERY_KEY, PROJECT_KEY } from '../constants';

/**
 * Preserves sidebar state params from current URL into target params.
 * Rules:
 * - Preserve compressed `_s` param
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
		if (
			(key === SIDEBAR_STATE_PARAM || key === HIDE_SIDEBAR_QUERY_KEY) &&
			!keysToPreserve.includes(key)
		) {
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

/**
 * A link or navigation target with the merge rule above applied, in the
 * shape the router takes. A target without a pathname stays on
 * `current.pathname`; one without a hash drops the current fragment.
 */
export function resolveTargetWithSidebarState(
	to: To,
	current: { pathname: string; search: string },
	projectIds: number[]
): ResolvedTo {
	const target = splitTarget(to);
	const search = mergeParamsWithSidebarState(
		new URLSearchParams(target.search),
		new URLSearchParams(current.search),
		projectIds
	).toString();

	return resolveTo(
		{ pathname: target.to, search, hash: target.hash },
		current.pathname
	);
}
