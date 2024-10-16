import { useParams } from 'react-router-dom';

import {
	SingleMeasurementChart,
	useGetSingleMeasurementQuery
} from '@/services/bublik-api';
import { MeasurementsRouterParams } from '@/shared/types';
import { Plot } from '@/shared/charts';
import { EChartsOption } from 'echarts-for-react';
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';

import { MeasurementStatisticsContainer } from '../../containers';
import { useMemo } from 'react';

export function ModeOverlay() {
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

// TODO: Add overlay container
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

	if (!data) return <div>No Data!</div>;

	return <StackedCharts charts={data.charts} />;
}

interface StackedChartsProps {
	charts: SingleMeasurementChart[];
}
function StackedCharts({ charts }: StackedChartsProps) {
	const option = useMemo<EChartsOption>(() => {
		const xAxisData = charts[0]?.dataset.slice(1).map(([x]) => x) || [];
		const series = charts.map((chart) => ({
			name: chart.axis_y_label,
			type: 'line' as const,
			stack: 'Total',
			emphasis: { focus: 'series' },
			data: chart.dataset.slice(1).map(([, y]) => y)
		}));

		return {
			title: { text: 'Stacked Chart' },
			tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
			legend: { data: charts.map((chart) => chart.axis_y_label) },
			grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
			xAxis: [{ type: 'category', boundaryGap: false, data: xAxisData }],
			yAxis: [{ type: 'value' }],
			series: series
		};
	}, [charts]);

	return (
		<div className="h-full">
			<Plot options={option} style={{ height: '100%' }} />
		</div>
	);
}
