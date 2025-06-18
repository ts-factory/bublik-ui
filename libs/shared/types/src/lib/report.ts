/* SPDX-License-Identifier: Apache-2.0 */

/* SPDX-FileCopyrightText: 2024 OKTET LTD */

export interface ReportRoot {
	content: Block[];
	unprocessed_iters: NotProcessedPoint[];
	warnings: string[];
	config: {
		name: string;
		description: string;
		version: number;
	};
}

export interface ArgsValBlock {
	id: string;
	type: 'arg-val-block';
	label: string;
	args_vals: Record<string, string | number>;
	content: MeasurementBlock[];
}

type Block = TestBlock;

export interface NotProcessedPoint {
	test_name: string;
	args_vals: Record<string, string | number>;
	common_args: Record<string, string | number> | undefined | null;
	reasons: string[];
}

export type TestBlock = {
	type: 'test-block';
	id: string;
	label: string;
	enable_table_view: boolean;
	enable_chart_view: boolean;
	common_args: Record<string, string | number>;
	content: ArgsValBlock[];
};

export type RecordBlock = {
	type: 'record-block';
	id: string;
	label?: string;
	chart?: ReportChart;
	table?: ReportTable;
};

export type ReportTable = {
	warnings: string[];
	formatters?: Record<string, string>;
	labels?: Record<string, string>;
	data: ReportSeries[];
};

export type ReportChart = {
	warnings: string[];
	axis_x: Axis & { values: number[] };
	axis_y: Axis;
	series_label?: string;
	data: ReportSeries[];
};

export type ReportSeries = {
	series?: string;
	points: ReportPoint[];
};

export type ReportPoint = Record<string, string | number> & {
	series: 'Suricata Rules';
	x_value: string;
	y_value: string;
	metadata?: {
		iteration_id?: number;
		result_id?: number;
		has_error?: boolean;
	};
};

type Axis = { label: string; key: string };

export type MeasurementBlock = {
	type: 'measurement-block';
	id: string;
	label: string;
	content: RecordBlock[];
};
