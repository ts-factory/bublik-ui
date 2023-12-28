/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, forwardRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { EChartsOption } from '../echart';
import { chartStyles, Plot } from '../plot';

export interface BarChartProps
	extends Pick<ComponentProps<typeof Plot>, 'style' | 'className'> {
	title: string;
	xAxis: EChartsOption['xAxis'];
	yAxis: EChartsOption['yAxis'];
	series: EChartsOption['series'];
	legend?: EChartsOption['legend'];
	tooltip?: EChartsOption['tooltip'];
	dataZoom?: EChartsOption['dataZoom'];
	dataset?: EChartsOption['dataset'];
}

export const BarChart = forwardRef<ReactEChartsCore, BarChartProps>(
	(props, ref) => {
		const {
			title,
			dataset,
			xAxis,
			yAxis,
			series,
			legend,
			dataZoom,
			tooltip,
			...restProps
		} = props;

		const options: EChartsOption = {
			title: {
				text: title,
				textStyle: { fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }
			},
			legend,
			dataZoom,
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'line' },
				textStyle: chartStyles.text,
				extraCssText: 'shadow-popover rounded-lg',
				...tooltip
			},
			dataset,
			xAxis,
			yAxis,
			series
		};

		return <Plot options={options} {...restProps} ref={ref} />;
	}
);
