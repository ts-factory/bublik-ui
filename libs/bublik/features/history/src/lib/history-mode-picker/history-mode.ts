/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

export const HISTORY_PAGE_MODES = [
	'linear',
	'aggregation',
	'measurements',
	'measurements-by-iteration',
	'measurements-combined'
] as const;

export type HistoryPageMode = (typeof HISTORY_PAGE_MODES)[number];

export function resolveHistoryMode(mode?: string | null): HistoryPageMode {
	return HISTORY_PAGE_MODES.includes(mode as HistoryPageMode)
		? (mode as HistoryPageMode)
		: 'linear';
}
