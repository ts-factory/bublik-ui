/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useState } from 'react';
import { Link, To, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

import { Point } from '@/shared/types';
import {
	ButtonTw,
	CardHeader,
	cn,
	Icon,
	Skeleton,
	toast,
	ToolbarButton,
	Tooltip,
	useSidebar
} from '@/shared/tailwind-ui';
import {
	ExportChart,
	getChartName,
	getColorByIdx,
	MeasurementChart
} from '@/shared/charts';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { SingleMeasurementChart } from '@/services/bublik-api';

import { useCombinedView } from './plot-list.hooks';
import { isDisabledForCombined, resolvePoint } from './plot-list.utils';
import { PlotPointModalContainer } from './components';

interface PlotListItemProps {
	idx: number;
	plot: SingleMeasurementChart;
	onAddChartClick: (args: {
		plot: SingleMeasurementChart;
		color: string;
	}) => void;
	combinedState: 'disabled' | 'active' | 'default' | 'waiting';
}

const PlotListItem = (props: PlotListItemProps) => {
	const { idx, plot, combinedState, onAddChartClick } = props;
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [point, setPoint] = useState<Point | null>(null);

	const handleChartPointClick = async (opts: { dataIndex: number }) => {
		const { dataIndex } = opts;
		const point = resolvePoint(plot, dataIndex);

		if (!point) return;

		setIsDialogOpen(true);
		setPoint(point);
	};

	const handleChartAddClick = (plot: SingleMeasurementChart) => {
		onAddChartClick({ plot, color: getColorByIdx(idx) });
	};

	return (
		<>
			{point && (
				<PlotPointModalContainer
					point={point}
					isDialogOpen={isDialogOpen}
					setIsDialogOpen={setIsDialogOpen}
				>
					<RunDetailsContainer runId={point.run_id} isFullMode />
				</PlotPointModalContainer>
			)}
			<li className="py-2.5 px-4">
				<MeasurementChart
					chart={plot}
					color={getColorByIdx(idx)}
					onChartPointClick={handleChartPointClick}
					additionalToolBarItems={
						<ToolbarButton
							aria-label="Add to combined chart"
							state={combinedState === 'active' ? 'active' : 'default'}
							disabled={combinedState === 'disabled'}
							onClick={() => handleChartAddClick(plot)}
						>
							<Icon name="AddSymbol" className="size-5" />
						</ToolbarButton>
					}
				/>
			</li>
		</>
	);
};

export const PlotListLoading = () => {
	return (
		<div className="bg-white rounded-md">
			<CardHeader label="Charts">
				<div className="flex items-stretch h-full gap-4">
					<Skeleton className="w-[75px] h-full rounded" />
				</div>
			</CardHeader>
			<ul className="chart-mosaic">
				{Array.from({ length: 6 }).map((_, idx) => (
					<li className="py-2.5 px-4" key={idx}>
						<Skeleton className="h-[334px] rounded" />
					</li>
				))}
			</ul>
		</div>
	);
};

export interface PlotListProps {
	plots: SingleMeasurementChart[];
	isFetching?: boolean;
}

export function PlotList({ plots, isFetching }: PlotListProps) {
	const { isSidebarOpen } = useSidebar();
	const {
		handleAddChartClick,
		handleRemoveClick,
		handleResetButtonClick,
		selectedCharts
	} = useCombinedView();

	return (
		<div
			className={cn(
				'bg-white rounded-md',
				isFetching && 'pointer-events-none opacity-60'
			)}
		>
			<div className="sticky top-0 z-10 bg-white rounded-md">
				<CardHeader label="Charts" enableStickyShadow>
					<div className="flex items-stretch gap-4">
						<ExportChart plots={plots} />
					</div>
				</CardHeader>
			</div>
			<ul
				className={cn(
					'[&>li]:border-b [&>li]:border-border-primary',
					isSidebarOpen
						? 'min-[1465px]:chart-mosaic'
						: 'min-[1368px]:chart-mosaic'
				)}
			>
				{plots.map((plot, idx) => {
					const isDisabled = isDisabledForCombined(
						plot,
						selectedCharts.map(({ plot }) => plot)
					);

					const state = selectedCharts.length
						? isDisabled
							? 'disabled'
							: selectedCharts.find(({ plot: p }) => p.id === plot.id)
							? 'active'
							: 'waiting'
						: 'default';

					return (
						<PlotListItem
							key={`${idx}_${plot.id}`}
							idx={idx}
							plot={plot}
							onAddChartClick={handleAddChartClick}
							combinedState={state}
						/>
					);
				})}
			</ul>
			<PlotStackedForm
				open={!!selectedCharts.length}
				label="Combined"
				plots={selectedCharts}
				onResetButtonClick={handleResetButtonClick}
				onRemoveClick={handleRemoveClick}
			/>
		</div>
	);
}

const variants: Variants = {
	visible: { opacity: 1, y: '0%' },
	hidden: { opacity: 0, y: '100%' },
	exit: { opacity: 0, y: '100%' }
};

const transition: Transition = { bounce: 0.1 };

export interface PlotStackedFormProps {
	label: string;
	open: boolean;
	plots: { plot: SingleMeasurementChart; color: string }[];
	onResetButtonClick?: () => void;
	onRemoveClick?: (plot: SingleMeasurementChart) => void;
}

const PlotStackedForm = (props: PlotStackedFormProps) => {
	const [searchParams] = useSearchParams();

	const linkToCombined = useMemo<To>(() => {
		const params = new URLSearchParams(searchParams);

		params.set('mode', 'measurements-combined');
		params.set('combinedPlots', props.plots.map((p) => p.plot.id).join(';'));

		return { pathname: '/history', search: params.toString() };
	}, [props.plots, searchParams]);

	return (
		<AnimatePresence>
			{props.open ? (
				<motion.div
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={transition}
					className="fixed bottom-4 right-4 bg-white rounded-lg shadow-popover min-w-[360px] px-4 py-2"
				>
					<h1 className="text-[0.875rem] leading-[1.125rem] font-semibold mb-2">
						{props.label}
					</h1>
					<ul className="flex flex-col gap-2 mb-4">
						{props.plots.map(({ plot }) => {
							return (
								<li
									key={plot.id}
									className="flex items-center justify-between p-2 border rounded border-border-primary hover:bg-gray-50"
								>
									<div>
										<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
											{getChartName(plot)}
										</span>
									</div>
									<Tooltip
										content="Remove from combined chart"
										disableHoverableContent
									>
										<button
											aria-label="Remove from compare"
											className="grid transition-colors rounded place-items-center text-text-unexpected hover:bg-red-100"
											onClick={() => props.onRemoveClick?.(plot)}
										>
											<Icon name="CrossSimple" />
										</button>
									</Tooltip>
								</li>
							);
						})}
					</ul>
					<div className="flex items-center gap-2">
						<ButtonTw
							variant="primary"
							size="md"
							rounded="lg"
							className="flex-1"
							asChild
						>
							<Link to={linkToCombined}>Open</Link>
						</ButtonTw>
						<ButtonTw
							variant="outline"
							size="md"
							rounded="lg"
							className="flex-1"
							onClick={props.onResetButtonClick}
						>
							Reset
						</ButtonTw>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};
