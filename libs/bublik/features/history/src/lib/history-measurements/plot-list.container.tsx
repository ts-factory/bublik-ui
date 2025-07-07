/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HistoryMeasurementResult } from '@/services/bublik-api';
import { InfoBlock, SelectedChartsPopover } from '@/shared/charts';
import { ButtonTw, CardHeader, Icon } from '@/shared/tailwind-ui';

import { useHistoryQuery } from '../hooks';
import { useHistoryActions } from '../slice';
import { HistoryEmpty } from '../history-empty';
import { HistoryError } from '../history-error';
import {
	useCombinedView,
	useGetHistoryMeasurements,
	useGetHistoryMeasurementsByResult,
	useHistoryMeasurementsTitle
} from './plot-list.hooks';
import { PlotList, PlotListLoading } from './plot-list.component';
import { Link } from 'react-router-dom';
import { routes } from '@/router';

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
		return <PlotListLoading label="Trend Charts" />;
	}

	if (!data?.length) {
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
				plots={data}
				isFetching={isFetching}
				enableResultErrorHighlight
				group="trend"
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

export function PlotListContainerByResult() {
	const { query } = useHistoryQuery();
	const { data, isLoading, error } = useGetHistoryMeasurementsByResult();
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
		return <PlotListLoading label="Measurements By Result" />;
	}

	if (!data?.length) {
		return (
			<HistoryEmpty
				type="no-results"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	return (
		<div className="bg-white rounded-md">
			<div className="sticky top-0 z-10 bg-white rounded-md">
				<CardHeader label="Series Charts" enableStickyShadow />
			</div>
			<MeasurementsList measurements={data} group="measurement" />
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

function MeasurementsList(
	props: MeasurementListProps & { group: 'trend' | 'measurement' }
) {
	const { measurements, group } = props;

	return (
		<div className="flex flex-col">
			{measurements.map((m) => {
				return (
					<div
						key={m.id}
						className="[&:not(:last-child)]:border-b border-border-primary"
					>
						<CardHeader label={m.test_name}>
							<div className="flex items-center gap-4">
								<ButtonTw variant="secondary" size="xss" asChild>
									<Link to={routes.run({ runId: m.run_id })}>
										<Icon name="BoxArrowRight" size={20} className="mr-1.5" />
										<span>Run</span>
									</Link>
								</ButtonTw>
								<ButtonTw variant="secondary" size="xss" asChild>
									<Link
										to={routes.measurements({
											runId: m.run_id,
											resultId: m.result_id
										})}
									>
										<Icon name="BoxArrowRight" size={20} className="mr-1.5" />
										<span>Result</span>
									</Link>
								</ButtonTw>
							</div>
						</CardHeader>
						<div className="py-2.5 px-4 border-b border-border-primary">
							<InfoBlock
								name={m.test_name}
								start={m.start}
								parameters={m.parameters_list}
							/>
						</div>
						{m.measurement_series_charts.length ? (
							<PlotList
								label="Charts"
								plots={m.measurement_series_charts}
								group={group}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
