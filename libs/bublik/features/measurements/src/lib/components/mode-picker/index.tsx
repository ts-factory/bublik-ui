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

const pluralRules = new Intl.PluralRules('en-US');
const suffixes = {
	one: '',
	other: 's'
} as const satisfies Record<'one' | 'other', string>;

function SelectedChartsContainer() {
	const { resultId } = useParams<MeasurementsRouterParams>();
	const { selectedCharts, resetCharts, removeChart, handleOpenButtonClick } =
		useResultSelectCharts();
	const { data, isLoading } = useGetSingleMeasurementQuery(
		resultId ?? skipToken
	);

	const count = selectedCharts.length;
	const rule = pluralRules.select(count) as 'one' | 'other';
	const label = `${count} chart${suffixes[rule]} selected`;
	const plots =
		data?.charts
			?.filter((chart) => selectedCharts.includes(chart.id))
			?.map((chart, idx) => ({
				plot: chart,
				color: getColorByIdx(idx)
			})) ?? [];

	if (isLoading) return;

	return (
		<SelectedChartsPopover
			label={label}
			selectionCount={selectedCharts.length}
			plots={plots}
			onResetButtonClick={resetCharts}
			onRemoveClick={(plot) => removeChart(plot.id)}
			onOpenButtonClick={handleOpenButtonClick}
		/>
	);
}
