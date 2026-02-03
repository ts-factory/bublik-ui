/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { matchPath, useLocation, type PathPattern } from 'react-router-dom';

export type ActivePattern = Pick<PathPattern, 'path' | 'end' | 'caseSensitive'>;

export function useIsActivePaths(patterns: ActivePattern[]) {
	const location = useLocation();
	return patterns.some((pattern) => matchPath(pattern, location.pathname));
}
