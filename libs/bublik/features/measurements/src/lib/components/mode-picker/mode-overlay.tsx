/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { StackedMeasurementChart } from '@/shared/charts';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { MeasurementStatisticsContainer } from '../../containers';
import { measurementsRoute } from '../../route';
import { useResultSelectCharts } from '../../hooks';

function ModeOverlay() {
	const { resultId } = measurementsRoute.useParams();

	return (
		<div className="p-2 h-full">
			<div className="flex flex-col gap-1 h-full">
				<MeasurementStatisticsContainer />
				<div className="relative transition-all bg-bg-primary rounded-md h-[120vh]">
					<CardHeader label="Charts" />
					<div className="h-full p-4">
						<OverlayContainer resultId={resultId} />
					</div>
				</div>
			</div>
		</div>
	);
}

interface OverlayContainerProps {
	resultId: string;
}

function OverlayContainer({ resultId }: OverlayContainerProps) {
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);
	const { selectedCharts } = useResultSelectCharts();

	const charts = useMemo(() => {
		if (!selectedCharts.length) return data?.charts;
		return data?.charts?.filter((chart) => selectedCharts.includes(chart.id));
	}, [data?.charts, selectedCharts]);

	if (error) return <BublikErrorState error={error} />;

	if (isLoading) {
		return (
			<div className="p-2 h-full">
				<Skeleton className="h-full rounded-md" />
			</div>
		);
	}

	if (!data || !charts?.length) {
		return (
			<BublikEmptyState
				title="No data"
				description="No charts available for this result"
			/>
		);
	}

	return <StackedMeasurementChart charts={charts} style={{ height: '100%' }} />;
}

export { ModeOverlay };
