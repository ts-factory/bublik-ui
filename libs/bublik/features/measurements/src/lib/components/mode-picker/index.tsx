/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { getColorByIdx, SelectedChartsPopover } from '@/shared/charts';
import { MeasurementsMode, MeasurementsRouterParams } from '@/shared/types';

import { ModeDefault } from './mode-default';
import { ModeCharts } from './mode-charts';
import { ModeTables } from './mode-tables';
import { ModeSplit } from './mode-split';
import { ModeOverlay } from './mode-overlay';
import { useResultSelectCharts } from '../../hooks';

const modeMap = {
	[MeasurementsMode.Charts]: ModeCharts,
	[MeasurementsMode.Split]: ModeSplit,
	[MeasurementsMode.Tables]: ModeTables,
	[MeasurementsMode.Overlay]: ModeOverlay,
	[MeasurementsMode.Default]: ModeDefault
};

export interface ModePickerProps {
	mode?: MeasurementsMode;
}

export const ModePicker = ({ mode }: ModePickerProps) => {
	const Component = modeMap[mode ?? MeasurementsMode.Default];
	const previousModeRef = useRef(mode ?? MeasurementsMode.Default);

	useEffect(() => {
		const nextMode = mode ?? MeasurementsMode.Default;
		const previousMode = previousModeRef.current;

		if (nextMode !== previousMode) {
			trackEvent(analyticsEventNames.measurementsModeChange, {
				fromMode: previousMode,
				toMode: nextMode
			});
		}

		previousModeRef.current = nextMode;
	}, [mode]);

	return (
		<>
			<Component />
			<SelectedChartsContainer />
		</>
	);
};

function SelectedChartsContainer() {
	const { resultId } = useParams<MeasurementsRouterParams>();
	const { selectedCharts, resetCharts, removeChart, handleOpenButtonClick } =
		useResultSelectCharts();
	const { data } = useGetSingleMeasurementQuery(resultId ?? skipToken);

	const handleResetButtonClick = () => {
		trackEvent(analyticsEventNames.measurementsCombinedReset, {
			selectedCount: selectedCharts.length
		});

		resetCharts();
	};

	const handleRemoveClick = (plot: { id: number }) => {
		trackEvent(analyticsEventNames.measurementsCombinedRemove, {
			selectedCount: Math.max(selectedCharts.length - 1, 0)
		});

		removeChart(plot.id);
	};

	const handleOpenClick = () => {
		trackEvent(analyticsEventNames.measurementsCombinedOpen, {
			selectedCount: selectedCharts.length
		});

		handleOpenButtonClick();
	};

	return (
		<SelectedChartsPopover
			open={!!selectedCharts.length}
			label="Combined"
			plots={
				data?.charts
					?.filter((chart) => selectedCharts.includes(chart.id))
					?.map((chart, idx) => ({
						plot: chart,
						color: getColorByIdx(idx)
					})) ?? []
			}
			onResetButtonClick={handleResetButtonClick}
			onRemoveClick={handleRemoveClick}
			onOpenButtonClick={handleOpenClick}
		/>
	);
}
