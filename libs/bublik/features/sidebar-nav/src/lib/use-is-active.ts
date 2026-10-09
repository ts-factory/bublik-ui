/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	matchRoutePath,
	useRenderedLocation,
	type RoutePathPattern
} from '@/router';

/** A route path (`/runs/$runId`), exact unless `fuzzy`. */
export type ActivePattern = RoutePathPattern;

/** Whether the page on screen is at any of `patterns`. */
export function useIsActivePaths(patterns: ActivePattern[]): boolean {
	const { pathname } = useRenderedLocation();
	return patterns.some((pattern) => matchRoutePath(pattern, pathname));
}
