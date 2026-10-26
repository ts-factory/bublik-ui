/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Ref, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { Plot } from '@/shared/charts';

import { AxisPointerEvent, useChartEvents } from '../runs-stats.hooks';
import { getTestsTimelineOption } from '../runs-stats.options';
import { RunsChartSelection } from '../runs-stats.component.utils';
import { RunsChartBucket } from '../runs-stats.types';
import { RunsChartPeriod } from '../runs-stats.utils';

interface TestsSectionProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	onSelect: (selection: RunsChartSelection) => void;
	chartRef?: Ref<ReactEChartsCore>;
	onZoom?: () => void;
	onPointer?: (params: AxisPointerEvent) => void;
}

export const TestsSection = ({
	stats,
	period,
	onSelect,
	chartRef,
	onZoom,
	onPointer
}: TestsSectionProps) => {
	const option = useMemo(
		() => getTestsTimelineOption(stats, period),
		[stats, period]
	);

	const events = useChartEvents({
		onClick: ({ dataIndex }) => {
			const bucket = stats[dataIndex];

			if (bucket) onSelect({ bucket });
		},
		onDataZoom: onZoom,
		onAxisPointer: onPointer
	});

	return (
		<section
			className="h-80 px-4 py-3 xl:h-auto xl:flex-1 xl:min-h-0"
			data-testid="runs-stats-tests-timeline"
		>
			<Plot
				options={option}
				onEvents={events}
				ref={chartRef}
				style={{ height: '100%' }}
			/>
		</section>
	);
};
