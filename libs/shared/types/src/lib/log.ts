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

export type LogPageSearch = {
	focusId?: string;
	mode?: LogPageMode;
};

export type LogPageParams = {
	runId: string;
};

export type HistoryDefaultResultAPIResponse = {
	result: {
		start: string;
		expected_result: RunResult;
		obtained_result: RunResult & { parameters: string[]; result_id: number };
		comments: string[];
		has_error: boolean;
		has_measurements: boolean;
		iteration_id: number;
		name: string;
		parameters: string[];
	};
};
