/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { matchRoutePath, type RoutePathPattern } from '@/router';

export type SubmenuMatchPattern = RoutePathPattern & {
	mode?: string | null;
	defaultMode?: string;
	emptyModeMatches?: string[];
};

export function getSubmenuIsActive(
	location: { pathname: string; search: string },
	pattern: SubmenuMatchPattern
): boolean {
	const pathMatch = matchRoutePath(pattern, location.pathname);
	if (!pathMatch) return false;

	if (pattern.mode === undefined) return true;

	const params = new URLSearchParams(location.search);
	const rawMode = params.get('mode');
	const normalizedMode = rawMode ?? pattern.defaultMode ?? null;

	if (pattern.mode === null) {
		if (normalizedMode === null) return true;
		return pattern.emptyModeMatches?.includes(normalizedMode) ?? false;
	}

	return normalizedMode === pattern.mode;
}
