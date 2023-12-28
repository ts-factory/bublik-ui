/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CELL_CONTEXT, CellContextValue } from '@/shared/types';

import { DASHBOARD_TABLE_ID } from '../hooks';

export type GetNextDatesReturn = {
	[DASHBOARD_TABLE_ID.Main]: Date | null;
	[DASHBOARD_TABLE_ID.Secondary]: Date | null;
};

export const getNextDates = (): GetNextDatesReturn => {
	return {
		[DASHBOARD_TABLE_ID.Main]: null,
		[DASHBOARD_TABLE_ID.Secondary]: null
	};
};

export const getUrl = (url: string, runId?: number) => {
	const map: Record<string, string> = {
		tree: `/log/${runId}?mode=treeAndinfoAndlog`,
		runs: `/runs/${runId}`
	};

	return map[url] ?? `/${url}/${runId}`;
};

export const getColorFromContext = (
	cellContext: CellContextValue | CELL_CONTEXT,
	mode?: 'hex' | 'tailwind'
): string => {
	const DEFAULT_HEX_COLOR = 'bg-[#f0f0f0]';
	const DEFAULT_TAILWIND_COLOR = 'bg-badge-0';

	const hexModeMap = {
		[CELL_CONTEXT.Success]: 'bg-[#e8fadc]',
		[CELL_CONTEXT.Warning]: 'bg-[#ffe8ca]',
		[CELL_CONTEXT.Error]: 'bg-[#ff9ca8]'
	} as const;

	const tailwindModeMap = {
		[CELL_CONTEXT.Success]: 'bg-badge-3',
		[CELL_CONTEXT.Warning]: 'bg-badge-4',
		[CELL_CONTEXT.Error]: 'bg-badge-5'
	} as const;

	if (mode === 'hex') {
		return hexModeMap[cellContext] ?? DEFAULT_HEX_COLOR;
	}

	if (mode === 'tailwind') {
		return tailwindModeMap[cellContext] ?? DEFAULT_TAILWIND_COLOR;
	}

	return tailwindModeMap[cellContext] ?? DEFAULT_TAILWIND_COLOR;
};
