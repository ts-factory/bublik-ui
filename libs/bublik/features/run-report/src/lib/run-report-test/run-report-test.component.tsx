/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useRef } from 'react';

import { useIsSticky } from '@/shared/hooks';
import { CardHeader, cn } from '@/shared/tailwind-ui';

import { RecordEntityBlock } from '../run-report.types';
import { RunReportChart } from '../run-report-chart';
import { RunReportTable } from '../run-report-table';

interface RunReportTestBlockProps {
	id: string;
	label: string;
	enableChartView: boolean;
	enableTableView: boolean;
	commonArgs: Record<string, string | number>;
	measurements: RecordEntityBlock[];
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const {
		id,
		label,
		commonArgs,
		enableChartView,
		enableTableView,
		measurements
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const { isSticky } = useIsSticky(ref);

	return (
		<div id={id} className="flex flex-col bg-white rounded">
			<CardHeader
				label={label}
				className={cn('sticky top-0 bg-white z-10 rounded-t')}
				style={
					isSticky
						? {
								boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 15px 0px',
								borderColor: 'transparent',
								borderRadius: 0
						  }
						: undefined
				}
				ref={ref}
			/>
			<ul className="flex flex-col">
				{measurements.map((measurement) => {
					return (
						<li key={measurement.id} className="border-b">
							<RunReportEntityBlock
								label={measurement.label}
								chart={measurement.dataset_chart}
								table={measurement.dataset_table}
								enableChartView={enableChartView}
								enableTableView={enableTableView}
								xKey={measurement.axis_x_key}
								xAxisLabel={measurement.axis_x_label}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

interface RunReportEntityBlockProps
	extends Pick<RunReportTestBlockProps, 'enableChartView' | 'enableTableView'> {
	table: Array<string | number>[];
	chart: Array<string | number>[];
	xKey: string;
	xAxisLabel: string;
	label: string;
}

function RunReportEntityBlock(props: RunReportEntityBlockProps) {
	const {
		chart,
		table,
		enableChartView,
		enableTableView,
		xKey,
		xAxisLabel,
		label
	} = props;

	return (
		<div className="flex gap-2">
			{enableChartView ? (
				<div className="border-r border-border-primary w-full px-4 py-2">
					<RunReportChart
						data={chart}
						xKey={xKey}
						xAxisLabel={xAxisLabel}
						label={label}
					/>
				</div>
			) : null}
			{enableTableView ? (
				<div className="w-full px-4 py-2 h-full">
					<RunReportTable data={table} />
				</div>
			) : null}
		</div>
	);
}

export { RunReportTestBlock };
