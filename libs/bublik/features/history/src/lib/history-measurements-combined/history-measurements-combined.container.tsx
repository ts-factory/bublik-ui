/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Point } from '@/shared/types';
import { createBublikError } from '@/services/bublik-api';
import { Chart, ChartPointClickHandler } from '@/shared/charts';
import { CardHeader, cn, Skeleton } from '@/shared/tailwind-ui';
import { RunDetailsContainer } from '@/bublik/features/run-details';

import { useGetHistoryMeasurements } from '../history-measurements/plot-list.hooks';
import { HistoryError } from '../history-error';
import { PlotPointModalContainer } from '../history-measurements/components';

export const HistoryMeasurementsCombinedContainer = () => {
	const [searchParams] = useSearchParams();
	const { data, isLoading, isFetching, error } = useGetHistoryMeasurements();
	const [point, setPoint] = useState<Point | null>(null);
	const [isPointDialogOpen, setIsPointDialogOpen] = useState(false);

	const plots = useMemo(() => {
		if (!data) return [];

		const plotIdsStr = searchParams.get('combinedPlots');

		if (!plotIdsStr) return [];

		const plotIds = plotIdsStr.split(';');

		return data.plots.filter((p) => plotIds.includes(p.id));
	}, [data, searchParams]);

	const handleCombinedPointClick: ChartPointClickHandler = (config) => {
		const point = plots[config.componentIndex].dots[config.dataIndex];

		setPoint(point);
		setIsPointDialogOpen(true);
	};

	if (isLoading) return <Skeleton className="h-screen rounded-sm" />;

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

	if (error) return <HistoryError error={error} />;

	return (
		<div className="bg-white rounded-md">
			<CardHeader label="Combined" />
			<div
				className={cn(
					'p-4 h-[78vh]',
					isFetching && 'pointer-events-none opacity-60'
				)}
			>
				<Chart
					id="Combined"
					plots={plots}
					style={{ height: '95%' }}
					onChartPointClick={handleCombinedPointClick}
					disableFullScreenToggle
				/>
				{point ? (
					<PlotPointModalContainer
						point={point}
						isDialogOpen={isPointDialogOpen}
						setIsDialogOpen={setIsPointDialogOpen}
					>
						<RunDetailsContainer runId={point.run_id} isFullMode />
					</PlotPointModalContainer>
				) : null}
			</div>
		</div>
	);
};
