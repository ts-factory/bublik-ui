/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, forwardRef } from 'react';

import { EChartsOption } from '../echart';
import { chartStyles, Plot } from '../plot';
import ReactEChartsCore from 'echarts-for-react/lib/core';

interface LineChartProps
	extends Pick<ComponentProps<typeof Plot>, 'className' | 'style'> {
	title: string;
	legend?: EChartsOption['legend'];
	dataZoom?: EChartsOption['dataZoom'];
	series: EChartsOption['series'];
	tooltip?: EChartsOption['tooltip'];
	dataset: EChartsOption['dataset'];
	xAxis: EChartsOption['xAxis'];
	yAxis: EChartsOption['yAxis'];
}

export const LineChart = forwardRef<ReactEChartsCore, LineChartProps>(
	(props, ref) => {
		const {
			legend,
			series,
			dataZoom,
			title,
			xAxis,
			yAxis,
			dataset,
			tooltip,
			...restProps
		} = props;

		const options: EChartsOption = {
			title: {
				text: title,
				textStyle: { fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }
			},
			tooltip: {
				textStyle: chartStyles.text,
				extraCssText: 'shadow-popover rounded-lg',
				...tooltip
			},
			legend,
			dataset,
			dataZoom,
			xAxis,
			yAxis,
			series
		};

		return <Plot options={options} {...restProps} ref={ref} />;
	}
);
