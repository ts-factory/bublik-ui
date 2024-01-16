/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MutableRefObject, useCallback, useEffect, useState } from 'react';
import { ECElementEvent } from 'echarts';
import type { EChartsInstance } from 'echarts-for-react';

import { ChartMode } from '../chart-control-panel';
import { createDataZoom, getOptions } from '../plot/utils';
import { resetZoom, toggleGlobalZoom } from '../utils';
import { ChartProps } from '../plot';

export interface ChartPointClickHandleConfig {
	componentIndex: number;
	dataIndex: number;
	chartId: string;
}

export type ChartPointClickHandler = (
	config: ChartPointClickHandleConfig
) => void;

export type UseChartConfig = ChartProps & { inFullScreen: boolean };

export const useChartControl = (
	ref: MutableRefObject<EChartsInstance | null>,
	config: UseChartConfig
) => {
	const { onChartPointClick, id, color, inFullScreen } = config;

	const [mode, setMode] = useState<ChartMode>('line');
	const [isZoomEnabled, setIsZoomEnabled] = useState(false);
	const [isSlidersEnabled, setIsSlidersEnabled] = useState(false);
	const [isFullScreenMode, setIsFullScreenMode] = useState(false);

	useEffect(() => {
		const instance = ref.current?.getEchartsInstance();

		if (!instance) return;

		const resize = () => instance.resize();
		const handleChartClick = (props: ECElementEvent) => {
			const { componentIndex, dataIndex } = props;

			onChartPointClick?.({ componentIndex, dataIndex, chartId: id });
		};

		instance.on('click', handleChartClick);
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	}, [id, onChartPointClick, ref]);

	const handleModeClick = useCallback(
		(mode: ChartMode) => {
			const instance = ref.current?.getEchartsInstance();

			if (!instance) return;

			setMode(mode);
			if ('plot' in config) {
				instance.setOption(getOptions({ plot: config.plot, mode, color }));
			} else {
				instance.setOption(getOptions({ plots: config.plots, mode, color }));
			}
		},
		[color, config, ref]
	);

	const handleResetZoomClick = useCallback(() => {
		const instance = ref.current?.getEchartsInstance();

		if (!instance) return;

		resetZoom(instance);
	}, [ref]);

	const handleZoomEnabledClick = useCallback(
		(isEnabled: boolean) => {
			const instance = ref.current?.getEchartsInstance();

			if (!instance) return;

			toggleGlobalZoom(instance, isEnabled);
			setIsZoomEnabled(isEnabled);
		},
		[ref]
	);

	const handleSlidersChange = useCallback(
		(isEnabled: boolean) => {
			setIsSlidersEnabled(isEnabled);
			const instance = ref.current?.getEchartsInstance();

			if (!instance) return;

			instance.setOption(
				{ dataZoom: createDataZoom({ showSliders: isEnabled }) },
				true,
				true
			);
		},
		[ref]
	);

	const handleFullScreenModeChange = useCallback(
		(isFullScreenMode: boolean) => setIsFullScreenMode(isFullScreenMode),
		[]
	);

	const optionsConfig =
		'plot' in config
			? {
					mode,
					color,
					showSliders: isSlidersEnabled,
					fullScreen: inFullScreen,
					plot: config.plot
			  }
			: {
					mode,
					color,
					showSliders: isSlidersEnabled,
					fullScreen: inFullScreen,
					plots: config.plots
			  };

	const options = getOptions(optionsConfig);

	return {
		handleModeClick,
		handleResetZoomClick,
		handleZoomEnabledClick,
		handleSlidersChange,
		handleFullScreenModeChange,
		mode,
		isZoomEnabled,
		isSlidersEnabled,
		isFullScreenMode,
		options
	} as const;
};
