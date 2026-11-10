/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunResult } from './run';

/**
|--------------------------------------------------
| QUERY TYPES
|--------------------------------------------------
*/

export const enum LogPageMode {
	Log = 'log',
	InfoAndLog = 'infoAndlog',
	TreeAndInfoAndLog = 'treeAndinfoAndlog',
	TreeAndLog = 'treeAndlog'
}

/** Every layout the log page renders; a log URL without `mode` is log-only. */
export const LOG_PAGE_MODES = [
	LogPageMode.TreeAndInfoAndLog,
	LogPageMode.TreeAndLog,
	LogPageMode.InfoAndLog,
	LogPageMode.Log
] as const;

export function isLogPageMode(value: unknown): value is LogPageMode {
	return LOG_PAGE_MODES.some((mode) => mode === value);
}

export type LogPageSearch = {
	focusId?: string;
	mode?: LogPageMode;
};

export type LogPageParams = {
	runId: string;
};
