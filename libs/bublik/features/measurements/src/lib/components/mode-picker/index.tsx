/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom';

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
			onResetButtonClick={resetCharts}
			onRemoveClick={(plot) => removeChart(plot.id)}
			onOpenButtonClick={handleOpenButtonClick}
		/>
	);
}
