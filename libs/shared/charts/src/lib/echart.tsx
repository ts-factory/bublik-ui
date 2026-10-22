/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { type ComponentProps, forwardRef } from 'react';

import type { ComposeOption, EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import type {
	LineSeriesOption,
	ScatterSeriesOption,
	PieSeriesOption,
	BarSeriesOption,
	ParallelSeriesOption
} from 'echarts/charts';
import { LineChart, ScatterChart, PieChart, BarChart } from 'echarts/charts';
import type {
	GridComponentOption,
	LegendComponentOption,
	TitleComponentOption
} from 'echarts/components';
import {
	DatasetComponent,
	DataZoomComponent,
	DataZoomInsideComponent,
	DataZoomSliderComponent,
	GridComponent,
	LegendComponent,
	TitleComponent,
	ToolboxComponent,
	TooltipComponent,
	DataZoomComponentOption
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type {
	SeriesOption,
	XAXisComponentOption,
	YAXisComponentOption
} from 'echarts';
import { useTheme } from '@/shared/hooks';

import { twTheme } from './tw-theme';
import { DARK_THEME_NAME, darkTheme } from './dark-theme';
import { DatasetOption, TooltipOption } from 'echarts/types/dist/shared';

// Register the required components
echarts.use([
	DataZoomComponent,
	DataZoomInsideComponent,
	DataZoomSliderComponent,
	DatasetComponent,
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LineChart,
	ScatterChart,
	ToolboxComponent,
	LegendComponent,
	PieChart,
	BarChart,
	CanvasRenderer
]);

export type {
	EChartsType,
	LineSeriesOption,
	ScatterSeriesOption,
	GridComponentOption,
	XAXisComponentOption,
	YAXisComponentOption,
	BarSeriesOption,
	PieSeriesOption,
	SeriesOption
};

export type EChartsOption = ComposeOption<
	| LineSeriesOption
	| BarSeriesOption
	| ScatterSeriesOption
	| PieSeriesOption
	| DataZoomComponentOption
	| YAXisComponentOption
	| XAXisComponentOption
	| ParallelSeriesOption
	| LegendComponentOption
	| TitleComponentOption
	| DatasetOption
	| TooltipOption
>;

export const getInstanceByDom = echarts.getInstanceByDom;
export { useChartSurfaceColor } from './dark-theme';

echarts.registerTheme(twTheme.themeName, twTheme);
echarts.registerTheme(DARK_THEME_NAME, darkTheme);

export const ReactECharts = forwardRef<
	ReactEChartsCore,
	ComponentProps<typeof ReactEChartsCore>
>((props, ref) => {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	// ECharts applies a theme only on init, so a theme change remounts the chart
	return (
		<ReactEChartsCore
			key={resolvedTheme}
			echarts={echarts}
			{...props}
			theme={isDark ? DARK_THEME_NAME : props.theme}
			ref={ref}
		/>
	);
});
