/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, CSSProperties, useRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { MeasurementPlot } from '@/shared/types';
import {
	Dialog,
	DialogClose,
	DialogPortal,
	DialogTitle,
	Icon,
	ModalContent
} from '@/shared/tailwind-ui';

import { ReactECharts } from '../echart';
import { getChartName } from '../utils';
import { ChartPointClickHandleConfig, useChartControl } from '../hooks';
import { ChartControlPanel } from '../chart-control-panel';
import { twTheme } from '../tw-theme';

const isStackedChart = (
	props: SingleChartProps | StackedChartProps
): props is StackedChartProps => {
	return 'plots' in props;
};

const isSingleChart = (
	props: SingleChartProps | StackedChartProps
): props is SingleChartProps => !isStackedChart(props);

type GeneralProps = {
	id: string;
	color?: string;
	onChartPointClick?: (config: ChartPointClickHandleConfig) => void;
	onAddChartClick?: (plot: MeasurementPlot) => void;
	disableFullScreenToggle?: boolean;
	combinedState?: 'disabled' | 'active' | 'default' | 'waiting';
	style?: CSSProperties;
};

type SingleChartProps = GeneralProps & { plot: MeasurementPlot };
type StackedChartProps = GeneralProps & { plots: MeasurementPlot[] };

export type ChartProps = SingleChartProps | StackedChartProps;

export const Chart = (props: ChartProps) => {
	const {
		id: passedId,
		color,
		onChartPointClick,
		onAddChartClick,
		disableFullScreenToggle,
		combinedState,
		style
	} = props;

	const chartRef = useRef<ReactEChartsCore | null>(null);
	const title = isSingleChart(props) ? getChartName(props.plot) : '';
	const id = disableFullScreenToggle ? `${passedId}_modal` : passedId;

	const {
		options,
		mode,
		isZoomEnabled,
		isSlidersEnabled,
		isFullScreenMode,
		handleModeClick,
		handleResetZoomClick,
		handleZoomEnabledClick,
		handleSlidersChange,
		handleFullScreenModeChange
	} = useChartControl(chartRef, {
		...props,
		inFullScreen: Boolean(disableFullScreenToggle)
	});

	return (
		<>
			<FullscreenChartModal
				open={isFullScreenMode}
				onOpenChange={handleFullScreenModeChange}
				title={title}
				// Chart props
				id={id}
				onChartPointClick={onChartPointClick}
				color={color}
				disableFullScreenToggle={isFullScreenMode}
				{...(isSingleChart(props)
					? { plot: props.plot }
					: { plots: props.plots })}
			/>
			<div className="w-full h-full" data-chart-id={id} data-testid="tw-chart">
				<div className="flex items-center justify-between mb-2">
					<span className="text-[0.6875rem] font-semibold leading-[0.875rem] text-text-secondary">
						{title}
					</span>
					<ChartControlPanel
						mode={mode}
						isZoomEnabled={isZoomEnabled}
						isSlidersShown={isSlidersEnabled}
						isCombined={isStackedChart(props)}
						onSlidersShownChange={handleSlidersChange}
						onModeChange={handleModeClick}
						onResetZoomClick={handleResetZoomClick}
						onZoomEnabledChange={handleZoomEnabledClick}
						onFullScreenModeChange={handleFullScreenModeChange}
						onAddPlotClick={
							isSingleChart(props) && onAddChartClick
								? () => onAddChartClick(props.plot)
								: undefined
						}
						isFullScreenMode={isFullScreenMode}
						disableFullscreenToggle={disableFullScreenToggle}
						combinedState={combinedState}
					/>
				</div>
				<ReactECharts
					key={id}
					option={options}
					notMerge={false}
					lazyUpdate={true}
					theme={twTheme.theme}
					ref={chartRef}
					style={disableFullScreenToggle ? { height: '90%', ...style } : style}
				/>
			</div>
		</>
	);
};

type FullscreenChartModalProps = Pick<
	ComponentProps<typeof Dialog>,
	'open' | 'onOpenChange'
> &
	ComponentProps<typeof Chart> & {
		title: string;
	};

export const FullscreenChartModal = (props: FullscreenChartModalProps) => {
	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogPortal>
				<ModalContent className="bg-white p-4 rounded-2xl w-[95vw] max-h-[95vh] h-[95vh]">
					<div className="flex items-center justify-between pb-4">
						<DialogTitle className="text-lg font-medium leading-6 text-gray-900">
							{props.title}
						</DialogTitle>
						<DialogClose className="rounded text-bg-compromised bg-transparent hover:bg-primary-wash hover:text-primary p-[5.5px]">
							<Icon name="Cross" />
						</DialogClose>
					</div>
					<Chart
						onChartPointClick={props.onChartPointClick}
						disableFullScreenToggle={true}
						{...(isSingleChart(props)
							? { plot: props.plot }
							: { plots: props.plots })}
						{...props}
					/>
				</ModalContent>
			</DialogPortal>
		</Dialog>
	);
};
