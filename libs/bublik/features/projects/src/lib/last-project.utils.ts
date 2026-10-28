/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { PROJECT_KEY } from '../constants';

const LAST_PROJECT_STORAGE_KEY = 'last-selected-projects';

const isProjectId = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value > 0;

/**
 * Project scope last picked in the sidebar. An empty list means "All", which
 * is a choice too, so it is remembered rather than treated as missing.
 */
export function readLastProjectIds(): number[] {
	try {
		const raw = window.localStorage.getItem(LAST_PROJECT_STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];

		return Array.isArray(parsed) ? parsed.filter(isProjectId) : [];
	} catch {
		return [];
	}
}

export function writeLastProjectIds(projectIds: number[]): void {
	try {
		window.localStorage.setItem(
			LAST_PROJECT_STORAGE_KEY,
			JSON.stringify(projectIds)
		);
	} catch {
		// Storage can be full or disabled; the URL still carries the project
	}
}

export function forgetLastProjectId(projectId: number): void {
	const projectIds = readLastProjectIds();

	if (!projectIds.includes(projectId)) return;

	writeLastProjectIds(projectIds.filter((id) => id !== projectId));
}

/**
 * Search params with the remembered project scope applied, or `null` when
 * nothing should change. A project already in the URL always wins, so shared
 * links open exactly as they were written.
 */
export function withLastProjectIds(
	searchParams: URLSearchParams,
	lastProjectIds: number[]
): URLSearchParams | null {
	if (searchParams.has(PROJECT_KEY) || !lastProjectIds.length) return null;

	const result = new URLSearchParams(searchParams);
	lastProjectIds.forEach((id) => result.append(PROJECT_KEY, id.toString()));

	return result;
}

export { LAST_PROJECT_STORAGE_KEY };
