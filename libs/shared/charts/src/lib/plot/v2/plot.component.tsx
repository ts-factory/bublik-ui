/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, forwardRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { EChartsOption, ReactECharts } from '../../echart';
import { twTheme } from '../../tw-theme';

export interface PlotProps {
	/* Options provided for plot */
	options: EChartsOption;
	/* Style for plot container */
	style?: CSSProperties;
	/* Classname for plot container */
	className?: string;
}

/* Internal plot that accepts all options use it as primitive for other charts */
export const Plot = forwardRef<ReactEChartsCore, PlotProps>((props, ref) => {
	const { options, className, style } = props;

	return (
		<ReactECharts
			option={options}
			theme={twTheme.themeName}
			className={className}
			style={style}
			ref={ref}
		/>
	);
});
