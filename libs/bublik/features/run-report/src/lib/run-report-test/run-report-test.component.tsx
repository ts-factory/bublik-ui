/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Link, useSearchParams } from 'react-router-dom';

import { ArgsValBlock } from '@/shared/types';
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
	argsValBlocks: ArgsValBlock[];
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const { enableChartView, enableTableView, argsValBlocks } = props;

	return (
		<ul className="flex flex-col">
			{argsValBlocks.map((argsValBlock) => {
				const params = Object.entries(argsValBlock.args_vals).map(
					([name, value]) => ({
						name,
						value: value.toString(),
						className: 'bg-badge-1'
					})
				);

				return (
					<li id={argsValBlock.id} key={argsValBlock.id}>
						<div className="border-y border-border-primary">
							<div className="border-b border-border-primary py-1.5 px-4 sticky top-9 bg-white">
								<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
									{argsValBlock.label}
								</span>
							</div>
							<div className="p-4">
								<RunReportArgs label="Args Val" items={params} />
							</div>
						</div>
						<ul>
							{argsValBlock.content.map((measurement) => {
								return (
									<li key={measurement.id}>
										<MeasurementBlock
											id={measurement.id}
											chart={measurement.dataset_chart}
											table={measurement.dataset_table}
											enableChartView={enableChartView}
											enableTableView={enableTableView}
											xKey={measurement.axis_x_key}
											xAxisLabel={measurement.axis_x_label}
											yAxisLabel={measurement.axis_y_label}
											warnings={measurement.warnings}
											formatters={measurement.formatters}
										/>
									</li>
								);
							})}
						</ul>
					</li>
				);
			})}
		</ul>
	);
}

interface RunReportEntityBlockProps
	extends Pick<RunReportTestBlockProps, 'enableChartView' | 'enableTableView'> {
	table?: Array<string | number>[];
	chart?: Array<string | number>[];
	xKey: string;
	xAxisLabel: string;
	yAxisLabel: string;
	id: string;
	warnings?: string[];
	formatters?: Record<string, string>;
}

function MeasurementBlock(props: RunReportEntityBlockProps) {
	const {
		chart,
		table,
		enableChartView,
		enableTableView,
		xKey,
		yAxisLabel,
		xAxisLabel,
		warnings,
		formatters,
		id
	} = props;

	const [searchParams] = useSearchParams();

	return (
		<div className="flex flex-col">
			<div className="flex max-h-96">
				{enableChartView && chart ? (
					<div className="flex-1">
						<div className="px-4 h-9 border-b border-border-primary flex items-center bg-white gap-2">
							<Link
								to={{ hash: id, search: searchParams.toString() }}
								className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
								onClick={() => toast.success('Saved location')}
							>
								{yAxisLabel}
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
												<li
													key={w}
													className="text-[0.875rem] leading-[1.125rem]"
												>
													{w}
												</li>
											))}
										</ul>
									</HoverCardContent>
								</HoverCard>
							) : null}
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
				{enableTableView && table ? (
					<div
						className={cn(
							'flex-1 flex flex-col shrink-0',
							enableChartView && chart && 'border-l border-border-primary'
						)}
					>
						<div className="px-4 h-9 flex-shrink-0 border-b border-border-primary flex items-center bg-white gap-2">
							<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
								{yAxisLabel}
							</span>
						</div>
						<div className="flex-1 overflow-auto">
							<RunReportTable data={table} formatters={formatters} />
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

export { RunReportTestBlock };
