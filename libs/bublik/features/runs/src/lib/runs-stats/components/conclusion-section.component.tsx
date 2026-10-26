/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Ref, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { Plot } from '@/shared/charts';
import { RUN_STATUS } from '@/shared/types';

import { AxisPointerEvent, useChartEvents } from '../runs-stats.hooks';
import { getConclusionTimelineOption } from '../runs-stats.options';
import { RunsChartSelection } from '../runs-stats.component.utils';
import { RunsChartBucket } from '../runs-stats.types';
import { RunsChartPeriod } from '../runs-stats.utils';

export interface ConclusionSectionProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	onSelect: (selection: RunsChartSelection) => void;
	timelineRef?: Ref<ReactEChartsCore>;
	onTimelineZoom?: () => void;
	onTimelinePointer?: (params: AxisPointerEvent) => void;
}

export const ConclusionSection = (props: ConclusionSectionProps) => {
	const {
		stats,
		period,
		onSelect,
		timelineRef,
		onTimelineZoom,
		onTimelinePointer
	} = props;
	const option = useMemo(
		() => getConclusionTimelineOption(stats, period),
		[stats, period]
	);

	const events = useChartEvents({
		onClick: ({ dataIndex, seriesId }) => {
			const bucket = stats[dataIndex];

			if (bucket && seriesId) {
				onSelect({ status: seriesId as RUN_STATUS, bucket });
			}
		},
		onDataZoom: onTimelineZoom,
		onAxisPointer: onTimelinePointer
	});

	return (
		<section
			className="h-80 px-4 py-3 xl:h-auto xl:flex-1 xl:min-h-0"
			data-testid="runs-stats-conclusions-timeline"
		>
			<Plot
				options={option}
				onEvents={events}
				ref={timelineRef}
				style={{ height: '100%' }}
			/>
		</section>
	);
};
