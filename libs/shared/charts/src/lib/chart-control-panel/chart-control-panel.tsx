/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps } from 'react';

import {
	Icon,
	Tooltip,
	Toolbar,
	ToolbarToggleGroup,
	ToolbarToggleItem,
	ToolbarButton,
	toolbarToggleGroupStyles,
	cn
} from '@/shared/tailwind-ui';

export type ChartMode = 'line' | 'scatter';

export type ChartModeProps = {
	mode?: ChartMode;
	isZoomEnabled?: boolean;
	isSlidersShown?: boolean;
	isFullScreenMode?: boolean;
	isCombined?: boolean;
	onSlidersShownChange?: (shown: boolean) => void;
	onModeChange?: (mode: ChartMode) => void;
	onResetZoomClick?: () => void;
	onZoomEnabledChange?: (isZoomEnabled: boolean) => void;
	onFullScreenModeChange?: (isFullScreenMode: boolean) => void;
	onAddPlotClick?: () => void;
	disableFullscreenToggle?: boolean;
	combinedState?: 'disabled' | 'active' | 'default' | 'waiting';
};

export const ChartControlPanel = ({
	mode = 'line',
	isZoomEnabled,
	onModeChange,
	onResetZoomClick,
	onZoomEnabledChange,
	isSlidersShown,
	onSlidersShownChange,
	onFullScreenModeChange,
	onAddPlotClick,
	isFullScreenMode,
	disableFullscreenToggle,
	isCombined,
	combinedState,
	...props
}: ChartModeProps) => {
	const handleZoomEnabledClick = () => onZoomEnabledChange?.(!isZoomEnabled);

	return (
		<Toolbar
			className="flex items-center gap-3"
			aria-label="Chart controls"
			data-testid="tw-chart-control-panel"
			{...props}
		>
			<div
				className={toolbarToggleGroupStyles({
					variant: 'primary',
					size: 'default'
				})}
			>
				<ChartToolbarButton
					icon="MagnifyingGlass"
					iconSize={18}
					tooltip={isZoomEnabled ? 'Enable zoom' : 'Disable zoom'}
					onClick={handleZoomEnabledClick}
					state={isZoomEnabled ? 'active' : 'default'}
				/>
				<ChartToolbarButton
					tooltip="Reset zoom"
					icon="ResetZoom"
					iconSize={20}
					onClick={onResetZoomClick}
				/>
				{!isCombined ? (
					<ChartToolbarButton
						icon="SettingsSliders"
						iconSize={18}
						state={isSlidersShown ? 'active' : 'default'}
						onClick={() => onSlidersShownChange?.(!isSlidersShown)}
						tooltip={isSlidersShown ? 'Hide sliders' : 'Show sliders'}
					/>
				) : null}
			</div>

			<ToolbarToggleGroup
				type="single"
				value={mode}
				variant="primary"
				size="default"
				onValueChange={(mode) => {
					if (!mode) return;

					onModeChange?.(mode as ChartMode);
				}}
				aria-label="Chart modes"
			>
				<ChartToggleItem
					value="line"
					tooltip="Enable line chart mode"
					icon="LineChartMode"
					iconSize={20}
				/>
				<ChartToggleItem
					value="scatter"
					tooltip="Enable scatter chart mode"
					icon="ScatterChartMode"
					iconSize={20}
				/>
			</ToolbarToggleGroup>
			{disableFullscreenToggle ? null : (
				<div
					className={toolbarToggleGroupStyles({
						variant: 'primary',
						size: 'default'
					})}
				>
					<ChartToolbarButton
						tooltip="Go to fullscreen"
						icon="ExpandSelection"
						iconSize={20}
						state={isFullScreenMode ? 'active' : 'default'}
						onClick={() => onFullScreenModeChange?.(!isFullScreenMode)}
					/>
					{onAddPlotClick ? (
						<Tooltip
							content="Add chart for stacked"
							disabled={combinedState === 'disabled'}
						>
							<ToolbarButton
								disabled={combinedState === 'disabled'}
								className={cn(
									'relative w-4 h-4 border rounded-md border-primary transition-all',
									'disabled:text-border-primary disabled:border-border-primary disabled:cursor-not-allowed',
									combinedState === 'active' && 'bg-primary text-white',
									combinedState === 'waiting' && 'border-dashed'
								)}
								onClick={onAddPlotClick}
							>
								<Icon
									name="AddSymbol"
									size={18}
									className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
								/>
							</ToolbarButton>
						</Tooltip>
					) : null}
				</div>
			)}
		</Toolbar>
	);
};

interface ChartToggleItemProps
	extends ComponentProps<typeof ToolbarToggleItem> {
	icon: ComponentProps<typeof Icon>['name'];
	iconSize: number;
	tooltip: string;
}

const ChartToggleItem = ({
	tooltip,
	icon,
	iconSize,
	...props
}: ChartToggleItemProps) => {
	return (
		<Tooltip content={tooltip}>
			<div>
				<ToolbarToggleItem {...props} aria-label={tooltip}>
					<Icon name={icon} size={iconSize} />
				</ToolbarToggleItem>
			</div>
		</Tooltip>
	);
};

interface ChartToggleButtonProps extends ComponentProps<typeof ToolbarButton> {
	icon: ComponentProps<typeof Icon>['name'];
	iconSize: number;
	tooltip: string;
}

const ChartToolbarButton = ({
	icon,
	iconSize,
	tooltip,
	...props
}: ChartToggleButtonProps) => {
	return (
		<Tooltip content={tooltip}>
			<ToolbarButton {...props} aria-label={tooltip}>
				<Icon name={icon} size={iconSize} />
			</ToolbarButton>
		</Tooltip>
	);
};
