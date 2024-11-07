/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

/**
 |--------------------------------------------------
 | ROUTER
 |--------------------------------------------------
 */

export const enum MeasurementsMode {
	Default = 'default',
	Charts = 'charts',
	Tables = 'tables',
	Split = 'split',
	Overlay = 'overlay'
}

export type MeasurementsRouterParams = {
	resultId: string;
	runId: string;
};

export type MeasurementsSearch = {
	mode?: MeasurementsMode;
};

/**
 |--------------------------------------------------
 | TYPES
 |--------------------------------------------------
 */

export type ResultInfoAPIResponse = {
	result: ResultInfo;
};

export type ResultInfo = {
	name: string;
	result_id: number;
	run_id: number;
	iteration_id: number;
	start: string;
	obtained_result: Result;
	expected_result: Result;
	parameters: string[];
	comments: string[];
	has_error: boolean;
	has_measurements: boolean;
};

export type Result = {
	result_type: string;
	verdict: string[];
};

/**
 |--------------------------------------------------
 | NEW
 |--------------------------------------------------
 */

export type Point = z.infer<typeof PointSchema>;

export const PointSchema = z
	.object({
		result_id: z.number(),
		iteration_id: z.number(),
		run_id: z.number()
	})
	.nonstrict();
