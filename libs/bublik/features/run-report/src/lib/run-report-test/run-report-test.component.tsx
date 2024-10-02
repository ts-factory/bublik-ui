/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Link, useSearchParams } from 'react-router-dom';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '@radix-ui/react-hover-card';

import { ArgsValBlock, RecordBlock } from '@/shared/types';
import {
	CardHeader,
	Icon,
	cn,
	popoverContentStyles,
	toast
} from '@/shared/tailwind-ui';

import { RunReportChart } from '../run-report-chart';
import { RunReportTable } from '../run-report-table';
import { RunReportArgs } from '../run-report.component';

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
										<CardHeader
											label={measurement.label}
											className="border-t border-border-primary"
										/>
										<ul>
											{measurement.content.map((record) => (
												<MeasurementBlock
													key={record.id}
													enableChartView={enableChartView}
													enableTableView={enableTableView}
													block={record}
												/>
											))}
										</ul>
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

type RunReportEntityBlockProps = Pick<
	RunReportTestBlockProps,
	'enableChartView' | 'enableTableView'
> & { block: RecordBlock };

function MeasurementBlock(props: RunReportEntityBlockProps) {
	const { enableChartView, enableTableView, block } = props;
	const {
		id,
		dataset_chart,
		dataset_table,
		axis_x_key,
		axis_x_label,
		axis_y_label,
		formatters,
		warnings,
		multiple_sequences
	} = block;
	const [searchParams] = useSearchParams();

	return (
		<div className="flex flex-col">
			<div className="flex max-h-96">
				{enableChartView && dataset_chart ? (
					<div className="flex-1">
						{multiple_sequences ? (
							<div className="px-4 h-9 border-b border-border-primary flex items-center bg-white gap-2">
								<Link
									to={{ hash: id, search: searchParams.toString() }}
									className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
									onClick={() => toast.success('Saved location')}
								>
									{axis_y_label}
								</Link>
								<WarningsHoverCard warnings={warnings} />
							</div>
						) : null}
						<div className="px-4 py-2">
							<RunReportChart
								data={dataset_chart}
								xKey={axis_x_key}
								xAxisLabel={axis_x_label}
								yAxisLabel={axis_y_label}
								label={''}
								enableLegend={multiple_sequences}
							/>
						</div>
					</div>
				) : null}
				{enableTableView && dataset_table ? (
					<div
						className={cn(
							'flex-1 flex flex-col shrink-0',
							enableChartView &&
								dataset_chart &&
								'border-l border-border-primary'
						)}
					>
						{multiple_sequences ? (
							<div className="px-4 h-9 flex-shrink-0 border-b border-border-primary flex items-center bg-white gap-2">
								<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
									{axis_y_label}
								</span>
							</div>
						) : null}
						<div className="flex-1 overflow-auto">
							<RunReportTable data={dataset_table} formatters={formatters} />
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

interface WarningsHoverCardProps {
	warnings?: string[];
}

function WarningsHoverCard({ warnings = [] }: WarningsHoverCardProps) {
	if (!warnings.length) return;

	return (
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
	);
}

export { RunReportTestBlock, WarningsHoverCard };
