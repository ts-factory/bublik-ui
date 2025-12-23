import { CSSProperties, ReactNode, useRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { SingleMeasurementChart } from '@/services/bublik-api';
import {
	DrawerContent,
	DrawerRoot,
	Icon,
	Toolbar,
	ToolbarButton,
	ToolbarToggleGroup,
	toolbarToggleGroupStyles,
	ToolbarToggleItem,
	Tooltip
} from '@/shared/tailwind-ui';
import { usePlatformSpecificCtrl } from '@/shared/hooks';

import { Plot } from '../plot';
import {
	ChartState,
	resolveOptions,
	resolveStackedOptions,
	SingleMeasurementChartWithContext
} from './measurement-chart.component.utils';
import {
	useChartState,
	useChartClick
} from './measurement-chart.component.hooks';

type ChartPointClickProps = { componentIndex: number; dataIndex: number };

interface MeasurementChartProps {
	chart: SingleMeasurementChart;
	color: string;
	onChartPointClick?: (props: ChartPointClickProps) => void;
	style?: CSSProperties;
	additionalToolBarItems?: ReactNode;
	isFullScreen?: boolean;
	enableResultErrorHighlight?: boolean;
}

const MeasurementChart = (props: MeasurementChartProps) => {
	const {
		chart,
		color,
		additionalToolBarItems,
		isFullScreen = false,
		enableResultErrorHighlight = false
	} = props;
	const ref = useRef<ReactEChartsCore>(null);
	const {
		state,
		toggleGlobalZoom,
		resetZoom,
		toggleSliders,
		changeMode,
		toggleFullScreen,
		toggleLimitYAxis
	} = useChartState({ chart, chartRef: ref, color });

	useChartClick({ ref, onChartPointClick: props.onChartPointClick });

	const isPressed = usePlatformSpecificCtrl();
	const options = resolveOptions(chart, state, {
		color,
		isModifierPressed: isPressed,
		isFullScreen,
		enableResultErrorHighlight
	});

	return (
		<>
			<DrawerRoot open={state.isFullScreen} onOpenChange={toggleFullScreen}>
				<DrawerContent className="w-[75vw] p-4">
					<MeasurementChart
						chart={chart}
						color={color}
						onChartPointClick={props.onChartPointClick}
						style={{ height: '100%' }}
						additionalToolBarItems={additionalToolBarItems}
						isFullScreen={true}
						enableResultErrorHighlight={enableResultErrorHighlight}
					/>
				</DrawerContent>
			</DrawerRoot>
			<MeasurementChartToolbar
				title={chart.title ?? chart.subtitle}
				state={state}
				toggleGlobalZoom={toggleGlobalZoom}
				resetZoom={resetZoom}
				toggleSliders={toggleSliders}
				toggleLimitYAxis={toggleLimitYAxis}
				changeMode={changeMode}
				toggleFullScreen={toggleFullScreen}
				additionalToolBarItems={additionalToolBarItems}
				isFullScreen={isFullScreen}
			/>
			<Plot options={options} notMerge={false} ref={ref} style={props.style} />
		</>
	);
};

interface MeasurementChartToolbarProps {
	title: string;
	state: ChartState;
	toggleGlobalZoom: () => void;
	resetZoom: () => void;
	toggleSliders: () => void;
	toggleLimitYAxis: () => void;
	changeMode: (type: string) => void;
	toggleFullScreen: (open?: boolean) => void;
	additionalToolBarItems?: ReactNode;
	isFullScreen?: boolean;
}

function MeasurementChartToolbar(props: MeasurementChartToolbarProps) {
	const {
		title,
		state,
		toggleGlobalZoom,
		resetZoom,
		toggleSliders,
		toggleLimitYAxis,
		changeMode,
		toggleFullScreen,
		additionalToolBarItems,
		isFullScreen
	} = props;

	return (
		<div className="flex items-center justify-between mb-2">
			<span className="text-[0.6875rem] font-semibold leading-[0.875rem] text-text-secondary">
				{title}
			</span>
			<Toolbar
				className="flex items-center gap-3"
				aria-label="Chart controls"
				data-testid="tw-chart-control-panel"
			>
				<div
					className={toolbarToggleGroupStyles({
						variant: 'primary',
						size: 'default'
					})}
				>
					<Tooltip
						content={state.isGlobalZoomEnabled ? 'Disable zoom' : 'Enable zoom'}
					>
						<ToolbarButton
							aria-label={
								state.isGlobalZoomEnabled ? 'Disable zoom' : 'Enable zoom'
							}
							onClick={toggleGlobalZoom}
							state={state.isGlobalZoomEnabled ? 'active' : 'default'}
						>
							<Icon name="MagnifyingGlass" className="size-5" />
						</ToolbarButton>
					</Tooltip>

					<Tooltip content="Reset zoom">
						<ToolbarButton aria-label="Reset zoom" onClick={resetZoom}>
							<Icon name="ResetZoom" className="size-5" />
						</ToolbarButton>
					</Tooltip>

					<Tooltip content={state ? 'Hide sliders' : 'Show sliders'}>
						<ToolbarButton
							aria-label={
								state.isSlidersVisible ? 'Hide sliders' : 'Show sliders'
							}
							onClick={toggleSliders}
							state={state.isSlidersVisible ? 'active' : 'default'}
						>
							<Icon name="SettingsSliders" className="size-5" />
						</ToolbarButton>
					</Tooltip>

					<Tooltip
						content={
							state.limitYAxis
								? 'Remove y-axis limit'
								: 'Limit y-axis to max/min values'
						}
					>
						<ToolbarButton
							aria-label={
								state.limitYAxis
									? 'Remove y-axis limit'
									: 'Limit y-axis to max/min values'
							}
							onClick={toggleLimitYAxis}
							state={state.limitYAxis ? 'active' : 'default'}
						>
							<Icon name="SwapArrows" className="size-5" />
						</ToolbarButton>
					</Tooltip>
				</div>

				<ToolbarToggleGroup
					type="single"
					value={state.mode}
					onValueChange={changeMode}
					variant="primary"
					size="default"
					aria-label="Chart modes"
					className={toolbarToggleGroupStyles({ variant: 'primary' })}
				>
					<Tooltip content="Line chart mode">
						<div>
							<ToolbarToggleItem value="line" aria-label="Line chart mode">
								<Icon name="LineChartMode" className="size-5" />
							</ToolbarToggleItem>
						</div>
					</Tooltip>
					<Tooltip content="Scatter chart mode">
						<div>
							<ToolbarToggleItem
								value="scatter"
								aria-label="Scatter chart mode"
							>
								<Icon name="ScatterChartMode" className="size-5" />
							</ToolbarToggleItem>
						</div>
					</Tooltip>
				</ToolbarToggleGroup>
				{isFullScreen ? null : (
					<div
						className={toolbarToggleGroupStyles({
							variant: 'primary',
							size: 'default'
						})}
					>
						<ToolbarButton
							aria-label={
								state.isFullScreen ? 'Close full screen' : 'Open full screen'
							}
							onClick={() => toggleFullScreen()}
							state={state.isFullScreen ? 'active' : 'default'}
						>
							<Icon name="ExpandSelection" className="size-5" />
						</ToolbarButton>
						{additionalToolBarItems}
					</div>
				)}
			</Toolbar>
		</div>
	);
}

interface StackedMeasurementChartProps {
	charts: SingleMeasurementChartWithContext[];
	style?: CSSProperties;
	onPointClick?: (config: ChartPointClickProps) => void;
	enableResultErrorHighlight?: boolean;
}

function StackedMeasurementChart(props: StackedMeasurementChartProps) {
	const ref = useRef<ReactEChartsCore>(null);
	useChartClick({ ref, onChartPointClick: props.onPointClick });

	const stackedOptions = resolveStackedOptions(props.charts, {
		enableResultErrorHighlight: props.enableResultErrorHighlight
	});

	return <Plot options={stackedOptions} style={props.style} ref={ref} />;
}

export { MeasurementChart, StackedMeasurementChart, MeasurementChartToolbar };
