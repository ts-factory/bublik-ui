/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState, useCallback, useRef, useEffect } from 'react';
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
import { useIsSticky } from '@/shared/hooks';

interface RunReportTestBlockProps {
	enableChartView: boolean;
	enableTableView: boolean;
	argsValBlocks: ArgsValBlock[];
	offsetTop: number;
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const { enableChartView, enableTableView, argsValBlocks, offsetTop } = props;
	const [searchParams] = useSearchParams();
	const [headerOffsetTop, setHeaderOffsetTop] = useState(0);

	const handleRef = useCallback((node: HTMLDivElement) => {
		setHeaderOffsetTop(node?.clientHeight ?? 0);
	}, []);

	return (
		<ul className="flex flex-col relative">
			{argsValBlocks.map((argsValBlock) => {
				const params = Object.entries(argsValBlock.args_vals).map(
					([name, value]) => ({
						name,
						value: value.toString(),
						className: 'bg-badge-1'
					})
				);

				return (
					<li
						id={encodeURIComponent(argsValBlock.id)}
						key={argsValBlock.id}
						className="relative"
					>
						<div
							className="absolute left-0 top-0 w-1 h-full bg-indigo-400"
							style={{ zIndex: 9 }}
						/>
						{/* LEVEL 2 */}
						<div
							className="border-y border-border-primary bg-white"
							style={{ position: 'sticky', top: offsetTop, zIndex: 8 }}
							ref={handleRef}
						>
							<div
								className="border-b border-border-primary py-1.5 px-4 bg-white"
								style={{ zIndex: 8 }}
							>
								<Link
									className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
									to={{
										search: searchParams.toString(),
										hash: encodeURIComponent(argsValBlock.id)
									}}
								>
									{argsValBlock.label}
								</Link>
							</div>
							<div className="p-4">
								<RunReportArgs label="Args Val" items={params} />
							</div>
						</div>
						<ul className="pl-1 flex flex-col">
							{argsValBlock.content.map((measurement, idx) => {
								return (
									<li
										id={encodeURIComponent(measurement.id)}
										key={measurement.id}
										className="relative"
									>
										{/* LEVEL 3 */}
										<CardHeader
											className={cn(
												'border-border-primary bg-primary-wash',
												idx !== 0 && 'border-t'
											)}
											style={{
												position: 'sticky',
												top: headerOffsetTop + offsetTop,
												zIndex: 6
											}}
											label={
												<Link
													className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
													to={{
														search: searchParams.toString(),
														hash: encodeURIComponent(measurement.id)
													}}
												>
													{measurement.label}
												</Link>
											}
										/>
										<div
											className="absolute left-0 top-0  w-1 h-full bg-indigo-500"
											style={{ zIndex: 6 }}
										/>
										<ul className="pl-1">
											{measurement.content.map((record) => (
												<li key={record.id} className="relative">
													<div
														className="absolute left-0 top-0 w-1 h-full bg-indigo-600"
														style={{ zIndex: 4 }}
													/>
													<MeasurementBlock
														key={record.id}
														enableChartView={enableChartView}
														enableTableView={enableTableView}
														block={record}
														offset={offsetTop + headerOffsetTop + 36}
													/>
												</li>
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
> & { block: RecordBlock; offset: number };

function MeasurementBlock(props: RunReportEntityBlockProps) {
	const { enableChartView, enableTableView, block, offset } = props;
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
	const ref = useRef<HTMLDivElement>(null);
	const [isSticky, setIsSticky] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (ref.current) {
				const { top } = ref.current.getBoundingClientRect();
				setIsSticky(top <= offset);
			}
		};

		document
			.getElementById('page-container')
			?.addEventListener('scroll', handleScroll);
		return () =>
			document
				.getElementById('page-container')
				?.removeEventListener('scroll', handleScroll);
	}, [offset]);

	return (
		<div className="flex flex-col pl-1">
			<div className="flex flex-col max-h-96" id={encodeURIComponent(id)}>
				{/* LEVEL 4 */}
				{multiple_sequences ? (
					<CardHeader
						label={
							<div className="flex items-center gap-2">
								<Link
									to={{
										hash: encodeURIComponent(id),
										search: searchParams.toString()
									}}
									className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
									onClick={() => toast.success('Saved location')}
								>
									{axis_y_label}
								</Link>
								<WarningsHoverCard warnings={warnings} />
							</div>
						}
						ref={ref}
						className="bg-white"
						style={{
							position: 'sticky',
							top: offset,
							zIndex: 5,
							boxShadow: isSticky
								? 'rgba(0, 0, 0, 0.1) 0px 0px 15px 0px'
								: undefined
						}}
					/>
				) : null}
				<div className="flex overflow-y-auto">
					{enableChartView && dataset_chart ? (
						<div className="flex-1">
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
							<div className="flex-1 overflow-auto">
								<RunReportTable data={dataset_table} formatters={formatters} />
							</div>
						</div>
					) : null}
				</div>
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
			<HoverCardContent asChild sideOffset={4} side="right" align="start">
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
