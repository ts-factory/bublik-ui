/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	HoverCard,
	HoverCardContent,
	HoverCardPortal,
	HoverCardTrigger
} from '@radix-ui/react-hover-card';

import { ArgsValBlock, RecordBlock } from '@/shared/types';
import { usePlatformSpecificCtrl } from '@/shared/hooks';
import {
	CardHeader,
	Icon,
	cn,
	popoverContentStyles,
	toast
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

import { StackedAdd } from '../run-report-stacked';
import { RunReportChart } from '../run-report-chart';
import { RunReportTable } from '../run-report-table';
import { RunReportArgs } from '../run-report.component';

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

				const isEmpty =
					Object.keys(argsValBlock.args_vals).length === 0 &&
					!argsValBlock.label;

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
							className={cn(
								'border-y border-border-primary bg-white',
								isEmpty && 'hidden'
							)}
							style={{ position: 'sticky', top: offsetTop, zIndex: 8 }}
							ref={handleRef}
						>
							<div
								className="border-b border-border-primary py-1.5 px-4 bg-white"
								style={{ zIndex: 8 }}
							>
								<LinkWithProject
									className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
									to={{
										search: searchParams.toString(),
										hash: encodeURIComponent(argsValBlock.id)
									}}
								>
									{argsValBlock.label}
								</LinkWithProject>
							</div>
							<div className="p-4">
								<RunReportArgs label="Argument Values" items={params} />
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
												<LinkWithProject
													className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
													to={{
														search: searchParams.toString(),
														hash: encodeURIComponent(measurement.id)
													}}
												>
													{measurement.label}
												</LinkWithProject>
											}
										/>
										<div
											className="absolute left-0 top-0  w-1 h-full bg-indigo-500"
											style={{ zIndex: 6 }}
										/>
										<ul className="pl-1">
											{measurement.content.map((record, idx, arr) => (
												<li
													key={record.id}
													className={cn(
														'relative',
														idx !== arr.length - 1 &&
															'border-b border-border-primary'
													)}
												>
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
	const { id, chart, table, label } = block;
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

	const tableScrollRef = useRef<HTMLDivElement>(null);
	const isPressed = usePlatformSpecificCtrl();

	useEffect(() => {
		function handleTableScroll(event: WheelEvent) {
			const tableElement = tableScrollRef.current;
			const pageContainer = document.getElementById('page-container');

			if (!tableElement || !pageContainer) return;

			// Determine whether to scroll the table or propagate to the page container
			if (isPressed) {
				// Allow table to scroll when modifier is pressed
				return;
			} else {
				// Scroll page container instead
				pageContainer.scrollBy({
					top: event.deltaY,
					left: event.deltaX,
					behavior: 'auto'
				});
				event.preventDefault(); // Prevent the table from handling the scroll
			}
		}

		const tableElement = tableScrollRef.current;
		tableElement?.addEventListener('wheel', handleTableScroll, {
			passive: false
		});

		return () => {
			tableElement?.removeEventListener('wheel', handleTableScroll);
		};
	}, [isPressed]);

	return (
		<div className="flex flex-col pl-1">
			<div className="flex flex-col h-[412px]" id={encodeURIComponent(id)}>
				{/* LEVEL 4 */}
				<CardHeader
					label={
						<div className="flex items-center gap-2">
							<LinkWithProject
								to={{
									hash: encodeURIComponent(id),
									search: searchParams.toString()
								}}
								className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
								onClick={() => toast.success('Saved location')}
							>
								{label}
							</LinkWithProject>
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
				<div className="flex overflow-y-auto h-full overflow-x-hidden">
					{chart ? (
						<div
							className={cn(
								'flex flex-col',
								enableTableView && table ? 'w-1/2' : 'w-full'
							)}
						>
							<div className="relative pt-2 h-full">
								<div className="absolute right-4 z-[1] top-2.5">
									<WarningsHoverCard warnings={chart.warnings} />
								</div>
								<RunReportChart
									chart={chart}
									stackedButton={<StackedAdd id={id} />}
								/>
							</div>
						</div>
					) : null}
					{enableTableView && table ? (
						<div
							className={cn(
								'flex flex-col',
								chart ? 'w-1/2' : 'w-full',
								enableChartView && chart && 'border-l border-border-primary'
							)}
						>
							<div
								className={cn('flex-1', 'overflow-y-auto overflow-x-auto')}
								ref={tableScrollRef}
							>
								<RunReportTable table={table} />
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
			<HoverCardPortal>
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
			</HoverCardPortal>
		</HoverCard>
	);
}

export { RunReportTestBlock, WarningsHoverCard };
