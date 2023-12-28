/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays } from 'date-fns';

import {
	RESULT_TYPE,
	RESULT_PROPERTIES,
	RUN_PROPERTIES,
	VERDICT_TYPE
} from '@/shared/types';

/**
|--------------------------------------------------
| ENV
|--------------------------------------------------
*/

export const DASHBOARD_POLLING_TIMER = 30000;

/**
|--------------------------------------------------
| DATES
|--------------------------------------------------
*/

export const DISPLAY_DATE_FORMAT = 'yyyy.MM.dd';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

/**
|--------------------------------------------------
| HISTORY
|--------------------------------------------------
*/

export const DEFAULT_FAILED_RESULTS: RESULT_TYPE[] = [
	RESULT_TYPE.Failed,
	RESULT_TYPE.Skipped,
	RESULT_TYPE.Killed,
	RESULT_TYPE.Cored,
	RESULT_TYPE.Skipped,
	RESULT_TYPE.Faked,
	RESULT_TYPE.Incomplete
];

export const DEFAULT_RESULT_TYPES: RESULT_TYPE[] = [
	RESULT_TYPE.Passed,
	RESULT_TYPE.Failed,
	RESULT_TYPE.Killed,
	RESULT_TYPE.Cored,
	RESULT_TYPE.Skipped,
	RESULT_TYPE.Faked,
	RESULT_TYPE.Incomplete
];

export const DEFAULT_RUN_PROPERTIES: RUN_PROPERTIES[] = [
	RUN_PROPERTIES.NotCompromised
];

export const DEFAULT_RESULT_PROPERTIES: RESULT_PROPERTIES[] = [
	RESULT_PROPERTIES.Expected,
	RESULT_PROPERTIES.Unexpected
];

export const DEFAULT_VERDICT_LOOKUP: VERDICT_TYPE = VERDICT_TYPE.String;

export const DEFAULT_HISTORY_START_DATE = addDays(new Date(), -31);

export const DEFAULT_HISTORY_END_DATE = new Date();

export const HISTORY_MAX_RESULTS_IDS = 6000;
