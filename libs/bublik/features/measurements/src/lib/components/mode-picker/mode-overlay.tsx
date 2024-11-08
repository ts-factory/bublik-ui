import { useParams } from 'react-router-dom';

import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { MeasurementsRouterParams } from '@/shared/types';
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { StackedMeasurementChart } from '@/shared/charts';

import { MeasurementStatisticsContainer } from '../../containers';

function ModeOverlay() {
	const { runId, resultId } = useParams<MeasurementsRouterParams>();

	if (!runId || !resultId) return null;

	return (
		<div className="p-2 h-full">
			<div className="flex flex-col gap-1 h-full">
				<MeasurementStatisticsContainer />
				<div className="relative transition-all bg-white rounded-md h-[120vh]">
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

	if (error) return <div>Error...</div>;

	if (isLoading) {
		return (
			<div className="p-2 h-full">
				<Skeleton className="h-full rounded-md" />
			</div>
		);
	}

	if (!data || !data.charts.length) return <div>No Data!</div>;

	return (
		<StackedMeasurementChart charts={data.charts} style={{ height: '100%' }} />
	);
}

export { ModeOverlay };
