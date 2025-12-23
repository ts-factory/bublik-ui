/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrayParam, useQueryParam, withDefault } from 'use-query-params';

import { routes } from '@/router';
import { HistoryMeasurementResult } from '@/services/bublik-api';
import { InfoBlock, SelectedChartsPopover } from '@/shared/charts';
import {
	ButtonTw,
	CardHeader,
	DataTableFacetedFilter,
	Icon
} from '@/shared/tailwind-ui';

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

	const uniqueParameters = useMemo(() => {
		const all = Array.from(
			new Set(data?.map((d) => d.parameters_list).flat()) ?? []
		)
			.sort()
			.map((param) => ({ label: param, value: param }));

		return all;
	}, [data]);

	const uniqueNames = useMemo(() => {
		return Array.from(
			new Set(
				data
					?.map((d) =>
						d.measurement_series_charts.map(
							(c) => `${c.title} - ${c.axis_y.label}`
						)
					)
					.flat()
			) ?? []
		)
			.sort()
			.map((name) => ({ label: name, value: name }));
	}, [data]);

	const [selectedByParam = [], setSelectedByParam] = useQueryParam(
		'parametersByResultFilter',
		withDefault(ArrayParam, []),
		{ updateType: 'replaceIn' }
	);

	const [selectedByName = [], setSelectedByName] = useQueryParam(
		'parametersByResultName',
		withDefault(ArrayParam, []),
		{ updateType: 'replaceIn' }
	);

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
		return <PlotListLoading label="Series Charts" />;
	}

	if (!data?.length) {
		return (
			<HistoryEmpty
				type="no-results"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	const filteredByParams = data.filter((m) => {
		if (!selectedByParam || !selectedByParam.length) return true;
		return selectedByParam.every(
			(param) => typeof param === 'string' && m.parameters_list.includes(param)
		);
	});

	return (
		<div className="bg-white rounded-md">
			<div className="sticky top-0 z-10 bg-white rounded-md">
				<CardHeader
					label={
						<div className="flex items-center gap-4">
							<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
								Series Charts
							</span>
							<DataTableFacetedFilter
								size="xss"
								title="Charts"
								value={
									selectedByName.filter((param) => typeof param === 'string') ??
									[]
								}
								onChange={setSelectedByName}
								options={uniqueNames}
							/>
							<DataTableFacetedFilter
								size="xss"
								title="Parameters"
								value={
									selectedByParam.filter(
										(param) => typeof param === 'string'
									) ?? []
								}
								onChange={setSelectedByParam}
								options={uniqueParameters}
							/>
						</div>
					}
					enableStickyShadow
				/>
			</div>
			<MeasurementsList
				measurements={filteredByParams}
				nameFilter={
					selectedByName.filter((param) => typeof param === 'string') ?? []
				}
				group="measurement"
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
	nameFilter?: string[];
}

function MeasurementsList(
	props: MeasurementListProps & { group: 'trend' | 'measurement' }
) {
	const { measurements, group, nameFilter = [] } = props;

	return (
		<div className="flex flex-col">
			{measurements.map((m, idx) => {
				const filtered =
					nameFilter.length > 0
						? m.measurement_series_charts.filter((c) =>
								nameFilter?.includes(`${c.title} - ${c.axis_y.label}`)
						  )
						: m.measurement_series_charts;

				return (
					<div
						key={`${idx}-${m.id}`}
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
								plots={filtered}
								parameters={m.parameters_list}
								group={group}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
