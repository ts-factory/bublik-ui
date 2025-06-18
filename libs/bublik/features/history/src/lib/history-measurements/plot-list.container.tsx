/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useHistoryQuery } from '../hooks';
import { useHistoryActions } from '../slice';
import { HistoryEmpty } from '../history-empty';
import { HistoryError } from '../history-error';
import {
	useCombinedView,
	useGetHistoryMeasurements,
	useHistoryMeasurementsTitle
} from './plot-list.hooks';
import { PlotList, PlotListLoading } from './plot-list.component';
import { HistoryMeasurementResult } from '@/services/bublik-api';
import { InfoBlock, SelectedChartsPopover } from '@/shared/charts';
import { CardHeader } from '@/shared/tailwind-ui';

export function PlotListContainer() {
	const { query } = useHistoryQuery();
	const { data, isLoading, isFetching, error } = useGetHistoryMeasurements();
	const actions = useHistoryActions();

	useHistoryMeasurementsTitle(query?.testName);

	const handleOpenGlobalFormClick = () => {
		actions.toggleIsGlobalSearchOpen(true);
	};

	const {
		handleRemoveClick,
		handleResetButtonClick,
		selectedCharts,
		handleOpenButtonClick
	} = useCombinedView();

	const noChartsAvailable =
		!data?.measurement_series_charts_by_result?.length &&
		!data?.trend_charts?.length;

	if (!query.testName) {
		return (
			<HistoryEmpty
				type="no-test-name"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	if (error) {
		return (
			<HistoryError error={error} onButtonClick={handleOpenGlobalFormClick} />
		);
	}

	if (isLoading) {
		return <PlotListLoading />;
	}

	if (noChartsAvailable) {
		return (
			<HistoryEmpty
				type="no-results"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<PlotList
				label="Trend Charts"
				plots={data.trend_charts}
				isFetching={isFetching}
				enableResultErrorHighlight
			/>
			<MeasurementsList
				measurements={data.measurement_series_charts_by_result}
			/>
			<SelectedChartsPopover
				open={!!selectedCharts.length}
				label="Combined"
				plots={selectedCharts}
				onResetButtonClick={handleResetButtonClick}
				onRemoveClick={handleRemoveClick}
				onOpenButtonClick={handleOpenButtonClick}
			/>
		</div>
	);
}

interface MeasurementListProps {
	measurements: HistoryMeasurementResult[];
}

function MeasurementsList(props: MeasurementListProps) {
	const { measurements } = props;

	return (
		<div className="flex flex-col gap-2">
			{measurements.map((m) => {
				return (
					<div key={m.id} className="bg-white rounded-md">
						<CardHeader label={m.test_name} />
						<div className="py-2.5 px-4 border-b border-border-primary">
							<InfoBlock
								name={m.test_name}
								start={m.start}
								parameters={m.parameters_list}
							/>
						</div>
						{m.measurement_series_charts.length ? (
							<PlotList label="Charts" plots={m.measurement_series_charts} />
						) : null}
					</div>
				);
			})}
		</div>
	);
}
