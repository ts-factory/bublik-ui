/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { linkOptions } from '@tanstack/react-router';

import { type Path, splitTo } from '@/router';
import { CELL_CONTEXT, CellContextValue, LogPageMode } from '@/shared/types';

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
 * Where a dashboard cell with a relative `url` handler leads, as the path
 * it was always built as: `tree` is the run's log in the tree mode, `runs`
 * the run page, anything else `/<url>/<runId>`.
 */
export const getUrl = (url: string, runId?: number | string): Path => {
	const map: Record<string, string> = {
		tree: `/log/${runId}?mode=treeAndinfoAndlog`,
		runs: `/runs/${runId}`
	};

	// The params may carry the rest of the path and a query of their own
	// (`runs` + `1726/report/?config=11`), so every target is split after it
	// is built, as the string link split the string it was handed.
	const { to, search, hash } = splitTo(map[url] ?? `/${url}/${runId}`);

	return { pathname: to, search, hash };
};

/** A run id as the routes write it back: digits, no leading zero. */
function canonicalRunId(params: number | string | undefined): number | null {
	const text = String(params ?? '');

	return /^[1-9]\d*$/.test(text) ? Number(text) : null;
}

/** The run page, typed against the route tree. */
const runTarget = (runId: number) =>
	linkOptions({ to: '/runs/$runId', params: { runId } });

/** The run's log in the tree mode, typed against the route tree. */
const logTarget = (runId: number) =>
	linkOptions({
		to: '/log/$runId',
		params: { runId },
		search: { mode: LogPageMode.TreeAndInfoAndLog }
	});

/**
 * Where a dashboard cell leads: the run page or the run's log as typed
 * routes when the handler names one by a plain run id, the path `getUrl`
 * builds otherwise (a handler of another page, or params that carry the
 * rest of a path, such as a configured report). An id the route would
 * rewrite (`042`) stays a path, so the link keeps its bytes.
 */
type CellTarget =
	| { kind: 'run'; link: ReturnType<typeof runTarget> }
	| { kind: 'log'; link: ReturnType<typeof logTarget> }
	| { kind: 'path'; to: Path };

export function getCellTarget(
	url: string,
	params?: number | string
): CellTarget {
	const runId = canonicalRunId(params);

	if (runId !== null && url === 'runs') {
		return { kind: 'run', link: runTarget(runId) };
	}
	if (runId !== null && url === 'tree') {
		return { kind: 'log', link: logTarget(runId) };
	}

	return { kind: 'path', to: getUrl(url, params) };
}

export type { CellTarget };

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
