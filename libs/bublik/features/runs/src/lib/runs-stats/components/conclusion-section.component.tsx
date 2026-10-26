/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Ref, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { Plot } from '@/shared/charts';
import { RUN_STATUS } from '@/shared/types';

import { useChartEvents } from '../runs-stats.hooks';
import {
	getConclusionTimelineOption,
	getConclusionTotalsOption,
	getPresentStatuses
} from '../runs-stats.options';
import { RunsChartSelection } from '../runs-stats.component.utils';
import { RunsChartBucket } from '../runs-stats.types';
import { RunsChartPeriod } from '../runs-stats.utils';

const TOTALS_ROW_HEIGHT = 30;
const TIMELINE_HEIGHT = 320;

export interface ConclusionSectionProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	onSelect: (selection: RunsChartSelection) => void;
	timelineRef?: Ref<ReactEChartsCore>;
	onTimelineZoom?: () => void;
}

export const ConclusionSection = (props: ConclusionSectionProps) => {
	const { stats, period, onSelect, timelineRef, onTimelineZoom } = props;
	const statuses = useMemo(() => getPresentStatuses(stats), [stats]);
	const totalsOption = useMemo(() => getConclusionTotalsOption(stats), [stats]);
	const timelineOption = useMemo(
		() => getConclusionTimelineOption(stats, period),
		[stats, period]
	);

	const totalsEvents = useChartEvents(({ dataIndex }) => {
		const status = statuses[dataIndex]?.status;

		if (status) onSelect({ status });
	});

	const timelineEvents = useChartEvents(({ dataIndex, seriesId }) => {
		const bucket = stats[dataIndex];

		if (bucket && seriesId)
			onSelect({ status: seriesId as RUN_STATUS, bucket });
	}, onTimelineZoom);

	return (
		<section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
			<div className="flex items-center px-4 py-4 border-b xl:border-b-0 xl:border-r border-border-primary">
				<Plot
					options={totalsOption}
					onEvents={totalsEvents}
					className="w-full"
					style={{ height: statuses.length * TOTALS_ROW_HEIGHT }}
				/>
			</div>
			<div className="px-4 py-3">
				<Plot
					options={timelineOption}
					onEvents={timelineEvents}
					ref={timelineRef}
					style={{ height: TIMELINE_HEIGHT }}
				/>
			</div>
		</section>
	);
};
