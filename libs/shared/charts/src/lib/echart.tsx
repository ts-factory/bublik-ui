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
import { twTheme } from './tw-theme';
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

echarts.registerTheme(twTheme.themeName, twTheme);

export const ReactECharts = forwardRef<
	ReactEChartsCore,
	ComponentProps<typeof ReactEChartsCore>
>((props, ref) => {
	return <ReactEChartsCore echarts={echarts} {...props} ref={ref} />;
});
