/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, forwardRef } from 'react';
import { LegendComponentOption } from 'echarts/components';
import { PieSeriesOption } from 'echarts/charts';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { EChartsOption } from '../echart';

import { chartStyles, Plot } from '../plot';

export interface PieChartProps
	extends Pick<ComponentProps<typeof Plot>, 'style' | 'className'> {
	title: string;
	label: string;
	legend?: LegendComponentOption;
	dataset?: EChartsOption['dataset'];
	series?: PieSeriesOption | PieSeriesOption[];
}

export const PieChart = forwardRef<ReactEChartsCore, PieChartProps>(
	({ title, label, legend, series, dataset, ...props }, ref) => {
		const options: EChartsOption = {
			legend,
			title: {
				text: title,
				left: 'center',
				textStyle: { fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }
			},
			tooltip: {
				textStyle: chartStyles.text,
				extraCssText: 'shadow-popover rounded-lg'
			},
			dataset,
			series
		};

		return <Plot options={options} {...props} ref={ref} />;
	}
);
