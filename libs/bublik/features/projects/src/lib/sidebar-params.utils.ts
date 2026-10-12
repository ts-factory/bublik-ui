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

const isAbsent = (value: unknown): boolean =>
	value === undefined || value === null;

/**
 * `mergeParamsWithSidebarState` for a typed link's search object (the route
 * middlewares serialize it): the target's keys first, in their order, then
 * `_s` and `hide-sidebar` from the current URL (in its order) unless the
 * target sets them, then the selected projects, which always replace the
 * target's. Key for key the query string `mergeParamsWithSidebarState`
 * writes.
 */
export function mergeSearchWithSidebarState(
	target: Record<string, unknown>,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };

	delete result[PROJECT_KEY];

	for (const key of new Set(currentSearchParams.keys())) {
		if (key !== SIDEBAR_STATE_PARAM && key !== HIDE_SIDEBAR_QUERY_KEY) continue;
		if (!isAbsent(result[key])) continue;

		const values = currentSearchParams.getAll(key);

		// An absent key keeps no slot: it is appended, as `append` does.
		delete result[key];
		result[key] = values.length === 1 ? values[0] : values;
	}

	if (projectIds.length) result[PROJECT_KEY] = projectIds;

	return result;
}
