/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { splitTo, type Path } from '@/router';
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

/**
 * Where a dashboard cell with a relative `url` handler leads, as a link
 * object for `LinkWithProject`: `tree` is the run's log in the tree mode,
 * `runs` the run page, anything else `/<url>/<runId>`.
 */
export const getUrl = (url: string, runId?: number | string): Path => {
	const map: Record<string, string> = {
		tree: `/log/${runId}?mode=treeAndinfoAndlog`,
		runs: `/runs/${runId}`
	};

	// The params may carry the rest of the path and a query of their own
	// (`runs` + `1726/report/?config=11`), so every target is split after it
	// is built, as `LinkWithProject` split the string it was handed.
	const { to, search, hash } = splitTo(map[url] ?? `/${url}/${runId}`);

	return { pathname: to, search, hash };
};

export const getColorFromContext = (
	cellContext: CellContextValue | CELL_CONTEXT,
	mode?: 'hex' | 'tailwind'
): string => {
	const DEFAULT_HEX_COLOR = 'bg-badge-0';
	const DEFAULT_TAILWIND_COLOR = 'bg-badge-0';

	const hexModeMap = {
		[CELL_CONTEXT.Success]: 'bg-badge-3',
		[CELL_CONTEXT.Warning]: 'bg-badge-14',
		[CELL_CONTEXT.Error]: 'bg-badge-15'
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
