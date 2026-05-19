/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ArgsValBlock, RecordBlock } from '@/shared/types';
import {
	usePageContainer,
	usePlatformSpecificCtrl,
	useProgressiveVisibleCount,
	useRenderWhenVisible
} from '@/shared/hooks';
import {
	ButtonTw,
	CardHeader,
	cn,
	Icon,
	Kbd,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

import { StackedAdd } from '../run-report-stacked';
import { RunReportChart } from '../run-report-chart';
import { RunReportTable } from '../run-report-table';
import { RunReportArgs } from '../run-report-args';
import { WarningsHoverCard } from '../run-report-warnings';
import { useDelegatedTableWheelScroll } from './run-report-test.hooks';
import { getArgsValNavigationTarget } from '../run-report-navigation.utils';
import type { ArgValNavigationItem } from '../run-report-navigation.utils';

const INITIAL_RECORDS_RENDER_COUNT = 10;
const RECORDS_RENDER_CHUNK_SIZE = 10;

interface RunReportTestBlockProps {
	enableChartView: boolean;
	enableTableView: boolean;
	enablePairGainColumns: boolean;
	argsValBlocks: ArgsValBlock[];
	offsetTop: number;
	argValNavigationItems: ArgValNavigationItem[];
	onArgValNavigate: (id: string) => void;
}

function RunReportTestBlock(props: RunReportTestBlockProps) {
	const {
		enableChartView,
		enableTableView,
		enablePairGainColumns,
		argsValBlocks,
		offsetTop,
		argValNavigationItems,
		onArgValNavigate
	} = props;
	const [searchParams] = useSearchParams();
	const [headerOffsetTop, setHeaderOffsetTop] = useState(0);
	const pageContainer = usePageContainer();
	const isPressed = usePlatformSpecificCtrl();

	useDelegatedTableWheelScroll({
		pageContainer,
		isModifierPressed: isPressed
	});

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
						data-offset={offsetTop}
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
							<CardHeader
								className="bg-white"
								style={{ zIndex: 8 }}
								label={
									<LinkWithProject
										className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem] hover:underline"
										to={{
											search: searchParams.toString(),
											hash: encodeURIComponent(argsValBlock.id)
										}}
									>
										{argsValBlock.label}
									</LinkWithProject>
								}
							>
								<ArgValNavigationControls
									currentId={argsValBlock.id}
									items={argValNavigationItems}
									onNavigate={onArgValNavigate}
								/>
							</CardHeader>
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
										data-offset={headerOffsetTop + offsetTop}
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
										<MeasurementRecordList
											records={measurement.content}
											enableChartView={enableChartView}
											enableTableView={enableTableView}
											enablePairGainColumns={enablePairGainColumns}
											offset={headerOffsetTop + offsetTop + 36}
											pageContainer={pageContainer}
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

interface ArgValNavigationControlsProps {
	currentId: string;
	items: ArgValNavigationItem[];
	onNavigate: (id: string) => void;
}

function ArgValNavigationControls(props: ArgValNavigationControlsProps) {
	const { currentId, items, onNavigate } = props;
	const previousItem = getArgsValNavigationTarget(items, currentId, 'previous');
	const nextItem = getArgsValNavigationTarget(items, currentId, 'next');

	return (
		<div className="flex items-center gap-1">
			<Tooltip content="Previous argument values (k)">
				<ButtonTw
					type="button"
					variant="secondary"
					size="xss"
					className="gap-1 px-1.5"
					aria-label="Previous argument values"
					disabled={!previousItem}
					onClick={() => previousItem && onNavigate(previousItem.id)}
				>
					<Icon name="ArrowShortTop" className="size-4" />
					<span>Prev</span>
					<Kbd>k</Kbd>
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Next argument values (j)">
				<ButtonTw
					type="button"
					variant="secondary"
					size="xss"
					className="gap-1 px-1.5"
					aria-label="Next argument values"
					disabled={!nextItem}
					onClick={() => nextItem && onNavigate(nextItem.id)}
				>
					<Icon name="ArrowShortTop" className="size-4 rotate-180" />
					<span>Next</span>
					<Kbd>j</Kbd>
				</ButtonTw>
			</Tooltip>
		</div>
	);
}

type RunReportEntityBlockProps = Pick<
	RunReportTestBlockProps,
	'enableChartView' | 'enableTableView'
> & {
	enablePairGainColumns: boolean;
	block: RecordBlock;
	offset: number;
	idx: number;
	pageContainer: HTMLElement | null;
};

interface MeasurementRecordListProps
	extends Pick<
		RunReportEntityBlockProps,
		| 'enableChartView'
		| 'enableTableView'
		| 'enablePairGainColumns'
		| 'offset'
		| 'pageContainer'
	> {
	records: RecordBlock[];
}

function MeasurementRecordList(props: MeasurementRecordListProps) {
	const { records, enableChartView, enableTableView, offset, pageContainer } =
		props;
	const { enablePairGainColumns } = props;
	const visibleCount = useProgressiveVisibleCount({
		totalCount: records.length,
		initialCount: INITIAL_RECORDS_RENDER_COUNT,
		chunkSize: RECORDS_RENDER_CHUNK_SIZE,
		idleTimeoutMs: 180
	});

	const visibleRecords = useMemo(
		() => records.slice(0, visibleCount),
		[records, visibleCount]
	);

	return (
		<ul className="pl-1">
			{visibleRecords.map((record, idx) => (
				<li
					key={record.id}
					className={cn(
						'relative',
						idx !== visibleRecords.length - 1 &&
							'border-b border-border-primary'
					)}
					data-offset={offset}
				>
					<div
						className="absolute left-0 top-0 w-1 h-full bg-indigo-600"
						style={{ zIndex: 4 }}
					/>
					<MeasurementBlock
						enableChartView={enableChartView}
						enableTableView={enableTableView}
						enablePairGainColumns={enablePairGainColumns}
						block={record}
						offset={offset}
						idx={idx}
						pageContainer={pageContainer}
					/>
				</li>
			))}
			{visibleCount < records.length ? (
				<li className="px-2 py-3" aria-hidden="true">
					<div className="h-10 rounded bg-primary-wash/60 animate-pulse" />
				</li>
			) : null}
		</ul>
	);
}

function MeasurementBlock(props: RunReportEntityBlockProps) {
	const {
		enableChartView,
		enableTableView,
		enablePairGainColumns,
		block,
		offset,
		idx
	} = props;
	const { id, chart, table, label } = block;
	const [searchParams] = useSearchParams();
	const ref = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const { pageContainer } = props;
	const shouldRenderHeavyContent = useRenderWhenVisible(contentRef, {
		root: pageContainer,
		rootMargin: '600px 0px',
		threshold: 0,
		freezeOnceVisible: true
	});

	return (
		<div className="flex flex-col pl-1" ref={contentRef}>
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
					enableStickyShadow={true}
					style={{
						position: 'sticky',
						top: offset,
						zIndex: 5
					}}
				/>
				<div className="flex overflow-y-auto h-full overflow-x-hidden">
					{shouldRenderHeavyContent ? (
						<>
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
											idx={idx}
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
										data-run-report-table-scroll="true"
									>
										<RunReportTable
											table={table}
											enablePairGainColumns={enablePairGainColumns}
										/>
									</div>
								</div>
							) : null}
						</>
					) : (
						<div className="w-full h-full p-2">
							<div className="w-full h-full rounded bg-primary-wash/60 animate-pulse" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export { RunReportTestBlock };
