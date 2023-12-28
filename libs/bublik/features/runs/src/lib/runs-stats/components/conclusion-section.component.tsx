/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ECElementEvent } from 'echarts';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { BarChart, PieChart } from '@/shared/charts';
import { getRunStatusInfo } from '@/shared/tailwind-ui';
import { RUN_STATUS } from '@/shared/types';

import {
	getPieChartDataByRunStatus,
	getRunStatus
} from '../runs-stats.component.utils';
import { GroupedStatsSchema, RunStats } from '../runs-stats.types';
import { RunsListModal } from './runs-list.component';

export interface ConclusionSectionProps {
	stats: RunStats[];
}

export const ConclusionSection = ({ stats }: ConclusionSectionProps) => {
	const { grouped, statuses } = getRunStatus(stats, 'week');
	const pieData = getPieChartDataByRunStatus(stats);
	const pieRef = useRef<ReactEChartsCore>(null);
	const barRef = useRef<ReactEChartsCore>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [runIds, setRunIds] = useState<string[]>([]);

	const handleOpenChange = (open: boolean) => {
		if (!open) setRunIds([]);

		setIsModalOpen(open);
	};

	const handlePieChartClick = useCallback(
		(params: ECElementEvent) => {
			setIsModalOpen(true);

			setRunIds(
				stats
					.filter((s) => s.runStatus === `run-${params.name.toLowerCase()}`)
					.map((s) => s.runId)
			);
		},
		[stats]
	);

	const handleBarChartClick = useCallback((params: ECElementEvent) => {
		const { ids: rawIds } = GroupedStatsSchema.parse(params.data);
		const ids = rawIds.split(',');

		setIsModalOpen(true);
		setRunIds(ids);
	}, []);

	useEffect(() => {
		pieRef.current?.getEchartsInstance()?.on('click', handlePieChartClick);
	}, [handlePieChartClick]);

	useEffect(() => {
		barRef.current?.getEchartsInstance()?.on('click', handleBarChartClick);
	}, [handleBarChartClick]);

	return (
		<section className="flex items-center border-b border-b-border-primary chart-mosaic">
			<RunsListModal
				ids={runIds}
				open={isModalOpen}
				onOpenChange={handleOpenChange}
			/>
			<div className="w-1/2 px-4 py-2">
				<PieChart
					title="Runs by conclusion"
					label="Runs"
					dataset={{ source: pieData }}
					legend={{ orient: 'vertical', left: 0, top: 0 }}
					series={[
						{
							type: 'pie',
							label: { formatter: '{b} ({d}%)' },
							itemStyle: {
								borderRadius: 4,
								borderWidth: 2,
								borderColor: '#fff',
								color: (params) =>
									getRunStatusInfo(
										`run-${params.name.toLowerCase()}` as RUN_STATUS
									).bgRaw
							},
							encode: {
								value: 'value',
								tooltip: 'value',
								itemName: 'name'
							}
						}
					]}
					ref={pieRef}
				/>
			</div>
			<div className="w-1/2 px-4 py-2">
				<BarChart
					title="Run conclusions by week"
					dataset={{ source: grouped }}
					legend={{}}
					xAxis={{ type: 'time', name: 'Date' }}
					yAxis={{ type: 'value', name: 'Runs' }}
					series={statuses.map((status) => {
						const { label, bgRaw } = getRunStatusInfo(status);

						return {
							type: 'bar',
							name: label.toUpperCase(),
							color: bgRaw,
							encode: { x: 'date', y: status },
							stack: 'run',
							emphasis: { focus: 'series' }
						};
					})}
					ref={barRef}
				/>
			</div>
		</section>
	);
};
