/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { Plot } from '@/shared/charts';

import { useChartClick } from '../runs-stats.hooks';
import { getTestsTimelineOption } from '../runs-stats.options';
import { RunsChartSelection } from '../runs-stats.component.utils';
import { RunsChartBucket } from '../runs-stats.types';
import { RunsChartPeriod } from '../runs-stats.utils';

const TIMELINE_HEIGHT = 320;

interface TestsSectionProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	onSelect: (selection: RunsChartSelection) => void;
}

export const TestsSection = ({
	stats,
	period,
	onSelect
}: TestsSectionProps) => {
	const option = useMemo(
		() => getTestsTimelineOption(stats, period),
		[stats, period]
	);

	const events = useChartClick(({ dataIndex }) => {
		const bucket = stats[dataIndex];

		if (bucket) onSelect({ bucket });
	});

	return (
		<section className="px-4 py-3">
			<Plot
				options={option}
				onEvents={events}
				style={{ height: TIMELINE_HEIGHT }}
			/>
		</section>
	);
};
