/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Link } from 'react-router-dom';

import { RecordEntityBlock } from '@/shared/types';
import { Icon, cn, popoverContentStyles, toast } from '@/shared/tailwind-ui';

import { RunReportChart } from '../run-report-chart';
import { RunReportTable } from '../run-report-table';
import { RunReportArgs } from '../run-report.component';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '@radix-ui/react-hover-card';

interface RunReportTestBlockProps {
	enableChartView: boolean;
	enableTableView: boolean;
	measurements: RecordEntityBlock[];
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const { enableChartView, enableTableView, measurements } = props;

	return (
		<ul className="flex flex-col">
			{measurements.map((measurement) => {
				return (
					<li
						id={measurement.id}
						key={measurement.id}
						className="border-b border-border-primary"
					>
						<RunReportEntityBlock
							id={measurement.id}
							label={measurement.label}
							chart={measurement.dataset_chart}
							table={measurement.dataset_table}
							enableChartView={enableChartView}
							enableTableView={enableTableView}
							xKey={measurement.axis_x_key}
							xAxisLabel={measurement.axis_x_label}
							yAxisLabel={measurement.axis_y_label}
							args={measurement.args_vals}
							warnings={measurement.warnings}
							formatters={measurement.formatters}
						/>
					</li>
				);
			})}
		</ul>
	);
}

interface RunReportEntityBlockProps
	extends Pick<RunReportTestBlockProps, 'enableChartView' | 'enableTableView'> {
	table: Array<string | number>[];
	chart: Array<string | number>[];
	xKey: string;
	xAxisLabel: string;
	yAxisLabel: string;
	label: string;
	args: Record<string, string | number>;
	id: string;
	warnings?: string[];
	formatters?: Record<string, string>;
}

function RunReportEntityBlock(props: RunReportEntityBlockProps) {
	const {
		chart,
		table,
		enableChartView,
		enableTableView,
		xKey,
		yAxisLabel,
		xAxisLabel,
		label,
		args,
		id,
		warnings,
		formatters
	} = props;

	const params = Object.entries(args).map(([name, value]) => ({
		name,
		value: value.toString(),
		className: 'bg-badge-1'
	}));

	return (
		<div className="flex flex-col">
			<div className="px-4 h-9 border-b border-border-primary flex items-center bg-white gap-2">
				<Link
					to={{ hash: id }}
					className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
					onClick={() => toast.success('Saved location')}
				>
					{label}
				</Link>
				{warnings?.length ? (
					<HoverCard openDelay={100}>
						<HoverCardTrigger asChild>
							<div className="text-text-unexpected rounded-md hover:bg-red-100 p-0.5 grid place-items-center">
								<Icon name="TriangleExclamationMark" size={20} />
							</div>
						</HoverCardTrigger>
						<HoverCardContent asChild sideOffset={4}>
							<ul
								className={cn(
									'flex flex-col gap-2 z-10 bg-white rounded-md shadow-popover px-4 py-2',
									popoverContentStyles
								)}
							>
								{warnings.map((w) => (
									<li key={w} className="text-[0.875rem] leading-[1.125rem]">
										{w}
									</li>
								))}
							</ul>
						</HoverCardContent>
					</HoverCard>
				) : null}
			</div>
			<div className="flex max-h-96">
				{enableChartView ? (
					<div className="flex-1">
						<div className="px-4 py-1.5 border-b border-border-primary">
							<RunReportArgs label="Args" items={params} />
						</div>
						<div className="px-4 py-2">
							<RunReportChart
								data={chart}
								xKey={xKey}
								xAxisLabel={xAxisLabel}
								yAxisLabel={yAxisLabel}
								label={''}
							/>
						</div>
					</div>
				) : null}
				{enableTableView ? (
					<div className="flex-1">
						<RunReportTable
							title={yAxisLabel}
							data={table}
							formatters={formatters}
						/>
					</div>
				) : null}
			</div>
		</div>
	);
}

export { RunReportTestBlock };
