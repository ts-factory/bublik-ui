/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Point } from '@/shared/types';
import { createBublikError } from '@/services/bublik-api';
import { CardHeader, cn, Skeleton } from '@/shared/tailwind-ui';
import { StackedMeasurementChart } from '@/shared/charts';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';

import {
	useCombinedView,
	useGetHistoryMeasurements,
	useGetHistoryMeasurementsByResult
} from '../history-measurements/plot-list.hooks';
import { HistoryError } from '../history-error';
import { resolvePoint } from '../history-measurements/plot-list.utils';

function HistoryMeasurementsCombinedContainer() {
	const [searchParams] = useSearchParams();
	const { data, isLoading, isFetching, error } = useGetHistoryMeasurements();
	const {
		data: byResult,
		isLoading: byResultLoading,
		isFetching: byResultFetching,
		error: byResultError
	} = useGetHistoryMeasurementsByResult();
	const [point, setPoint] = useState<Point | null>(null);
	const [isPointDialogOpen, setIsPointDialogOpen] = useState(false);
	const { selectedGroup, selectedCharts, syncChartsFromData } =
		useCombinedView();

	useEffect(() => {
		if (!data || !byResult) return;

		const allCharts = [
			...data,
			...byResult.flatMap((c) => c.measurement_series_charts)
		];

		syncChartsFromData(allCharts);
	}, [data, byResult, syncChartsFromData]);

	const plots = useMemo(() => {
		if (!data) return [];
		if (!byResult) return [];

		const allCharts = [
			...data,
			...byResult.flatMap((c) => c.measurement_series_charts)
		];

		const plotIdsStr = searchParams.get('combinedPlots');

		if (!plotIdsStr) return [];

		const plotIds = plotIdsStr.split(';').map(String);

		return allCharts
			.filter((p) => plotIds.includes(String(p.id)))
			.map((p) => ({
				...p,
				parameters: selectedCharts.find((c) => c.plot.id === p.id)?.parameters
			}));
	}, [byResult, data, searchParams, selectedCharts]);

	const handleCombinedPointClick: ComponentProps<
		typeof StackedMeasurementChart
	>['onPointClick'] = (config) => {
		const plot = plots?.[config.componentIndex];

		if (!plot) return;

		const point = resolvePoint(plot, config.dataIndex);

		if (!point) return;

		setPoint(point);
		setIsPointDialogOpen(true);
	};

	if (isLoading || byResultLoading) {
		return <Skeleton className="h-screen rounded-sm" />;
	}

	if (!plots.length) {
		return (
			<HistoryError
				error={createBublikError({
					title: 'You have not selected plots',
					description: 'You need to select multiple plots to use this page',
					status: 400
				})}
				withoutStatus
			/>
		);
	}

	if (error || byResultError) {
		return <HistoryError error={error || byResultError} />;
	}

	return (
		<>
			{point && (
				<LogPreviewContainer
					runId={point?.run_id}
					resultId={point?.result_id}
					measurementId={point?.result_id}
					open={isPointDialogOpen}
					onOpenChange={setIsPointDialogOpen}
				/>
			)}
			<div className="bg-white rounded-md">
				<CardHeader label="Charts" />
				<div
					className={cn(
						'p-4 h-[78vh]',
						(isFetching || byResultFetching) && 'pointer-events-none opacity-60'
					)}
				>
					<StackedMeasurementChart
						charts={plots}
						style={{ height: '100%' }}
						onPointClick={handleCombinedPointClick}
						enableResultErrorHighlight={selectedGroup === 'trend'}
					/>
				</div>
			</div>
		</>
	);
}

export { HistoryMeasurementsCombinedContainer };
