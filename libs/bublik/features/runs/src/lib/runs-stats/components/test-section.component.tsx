/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';
import { ECElementEvent } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { BarChart, PieChart } from '@/shared/charts';

import {
	COLOR_MAP,
	getGroupedByWeek,
	getPieChartDataForResults
} from '../runs-stats.component.utils';
import { RunStats, TestByWeekDaySchema } from '../runs-stats.types';
import { RunsListModal } from './runs-list.component';

interface TestsSectionProps {
	stats: RunStats[];
}

export const TestsSection = ({ stats }: TestsSectionProps) => {
	const barRef = useRef<ReactEChartsCore>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [runIds, setRunIds] = useState<string[]>([]);

	const handleOpenChange = (open: boolean) => {
		if (!open) setRunIds([]);

		setIsModalOpen(open);
	};

	const handleBarChartClick = (params: ECElementEvent) => {
		const { ids } = TestByWeekDaySchema.parse(params.value);
		const runIds = ids.split(',');

		setRunIds(runIds);
		setIsModalOpen(true);
	};

	useEffect(() => {
		barRef.current?.getEchartsInstance()?.on('click', handleBarChartClick);
	}, []);

	return (
		<section className="flex items-center chart-mosaic">
			<RunsListModal
				ids={runIds}
				open={isModalOpen}
				onOpenChange={handleOpenChange}
			/>
			<div className="w-1/2 px-4 py-2">
				<PieChart
					title="Tests by result"
					label="Results"
					dataset={{ source: getPieChartDataForResults(stats) }}
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
									COLOR_MAP.get(params.name.toLowerCase()) ?? 'blue'
							},
							encode: {
								itemName: 'name',
								value: 'value',
								tooltip: 'value'
							}
						}
					]}
				/>
			</div>
			<div className="w-1/2 px-4 py-2">
				<BarChart
					title="Tests by week"
					dataset={{ source: getGroupedByWeek(stats) }}
					legend={{}}
					xAxis={{ type: 'time', name: 'Date' }}
					yAxis={[
						{ type: 'value', name: 'Results' },
						{ id: 'passrate', type: 'value', name: 'Pass rate' }
					]}
					series={[
						{
							yAxisId: 'passrate',
							type: 'line',
							tooltip: { valueFormatter: (v) => `${v}%` },
							name: 'Pass rate',
							encode: { x: 'date', y: 'passrate' },
							emphasis: { focus: 'series' }
						},
						{
							type: 'bar',
							name: 'OK',
							color: COLOR_MAP.get('ok'),
							encode: { x: 'date', y: 'ok' },
							stack: 'results',
							emphasis: { focus: 'series' }
						},
						{
							type: 'bar',
							name: 'NOK',
							color: COLOR_MAP.get('nok'),
							encode: { x: 'date', y: 'nok' },
							stack: 'results',
							emphasis: { focus: 'series' }
						}
					]}
					ref={barRef}
				/>
			</div>
		</section>
	);
};
