/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/**
|--------------------------------------------------
| ROUTER
|--------------------------------------------------
*/

export const enum MeasurementsMode {
	Default = 'default',
	Charts = 'charts',
	Tables = 'tables',
	Split = 'split'
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

export type MeasurementToolInfo = {
	type: string;
	name: string;
	tool: string;
};

export type MeasurementDescription = {
	aggr: string;
	multiplier: string;
	units: string;
};

export type MeasurementMeta = {
	keys: string[];
	comments: string[];
};

export type MeasurementPlot = MeasurementToolInfo &
	MeasurementDescription &
	MeasurementMeta & {
		id: string;
		dots: Point[];
		axises_config: AxisConfig;
	};

export type MeasurementPlotWithoutId = Omit<MeasurementPlot, 'id'>;

export type PointMeta = {
	result_id: number;
	iteration_id: number;
	run_id: number;
};

export type Point = PointMeta & Record<string, string | number>;

export interface AxisConfig {
	title: string;
	default_x: string;
	default_y: string;
	getters: string[];
	axises: Record<string, AxisDescription>;
}

export type AxisDescription = {
	getter: string;
	label: string;
	units: string;
};

export interface ChartAxis {
	label: string;
	values: (string | number)[];
	units: string;
}
