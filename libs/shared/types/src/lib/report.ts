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
	id: string;
	type: 'record-block';
	warnings: string[];
	multiple_sequences: true;
	axis_x_key: string;
	axis_x_label: string;
	axis_y_label: string;
	formatters: Record<string, string>;
	dataset_table?: Array<Array<string | number>>;
	dataset_chart?: Array<Array<string | number>>;
};

export type MeasurementBlock = {
	type: 'measurement-block';
	id: string;
	label: string;
	content: RecordBlock[];
};
