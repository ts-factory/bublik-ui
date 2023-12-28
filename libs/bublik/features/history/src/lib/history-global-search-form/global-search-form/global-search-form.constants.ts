/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays } from 'date-fns';
import {
	VERDICT_TYPE,
	RESULT_TYPE,
	RUN_PROPERTIES,
	RESULT_PROPERTIES
} from '@/shared/types';

interface HistoryConfig {
	verdict: VERDICT_TYPE;
	results: RESULT_TYPE[];
	runProperties: RUN_PROPERTIES[];
	resultProperties: RESULT_PROPERTIES[];
	startDate: Date;
	endDate: Date;
}

const createHistoryConfig = (): HistoryConfig => {
	const defaultVerdict = VERDICT_TYPE.String;

	const defaultResults = [
		RESULT_TYPE.Passed,
		RESULT_TYPE.Failed,
		RESULT_TYPE.Killed,
		RESULT_TYPE.Cored,
		RESULT_TYPE.Skipped,
		RESULT_TYPE.Faked,
		RESULT_TYPE.Incomplete
	];
	const defaultRunProperties = [RUN_PROPERTIES.NotCompromised];

	const defaultResultProperties = [
		RESULT_PROPERTIES.Expected,
		RESULT_PROPERTIES.Unexpected
	];

	const defaultStartDate = addDays(new Date(), -93);
	const defaultEndDate = new Date();

	return {
		verdict: defaultVerdict,
		results: defaultResults,
		runProperties: defaultRunProperties,
		resultProperties: defaultResultProperties,
		startDate: defaultStartDate,
		endDate: defaultEndDate
	};
};

export const HISTORY_CONSTANTS = createHistoryConfig();
