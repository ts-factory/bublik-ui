/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useNavigate } from 'react-router-dom';

import { BarChart, LineChart } from '@/shared/charts';

import { COLOR_MAP } from '../runs-stats.component.utils';
import { RunsStatsSchema, RunStats } from '../runs-stats.types';

interface DaySectionProps {
	stats: RunStats[];
}

export const DaySection = ({ stats }: DaySectionProps) => {
	const navigate = useNavigate();
	const lineRef = useRef<ReactEChartsCore>(null);

	useEffect(() => {
		const instance = lineRef.current?.getEchartsInstance();

		if (!instance) return;

		instance.on('click', (params) => {
			const { runId } = RunsStatsSchema.parse(params.data);

			navigate({ pathname: `/runs/${runId}` });
		});
	}, [navigate]);

	return (
		<section className="border-b border-b-border-primary">
			<div className="px-4 py-2">
				<BarChart
					title="Tests by day"
					dataset={{ source: stats }}
					tooltip={{ trigger: 'axis' }}
					legend={{}}
					dataZoom={[{}, { type: 'inside' }]}
					xAxis={{ type: 'time', name: 'Date' }}
					yAxis={[
						{ type: 'value', name: 'Tests' },
						{ id: 'passrate', type: 'value', name: 'Pass rate' }
					]}
					series={[
						{
							type: 'bar',
							name: 'OK',
							color: COLOR_MAP.get('ok'),
							encode: { x: 'date', y: 'ok' },
							emphasis: { focus: 'series' },
							stack: 'stack'
						},
						{
							type: 'bar',
							name: 'NOK',
							color: COLOR_MAP.get('nok'),
							encode: { x: 'date', y: 'nok' },
							emphasis: { focus: 'series' },
							stack: 'stack'
						},
						{
							yAxisId: 'passrate',
							type: 'line',
							name: 'Pass Rate',
							encode: { x: 'date', y: 'passrate' },
							tooltip: { valueFormatter: (v) => `${v}%` }
						}
					]}
					ref={lineRef}
				/>
			</div>
			<div className="px-4 py-2">
				<LineChart
					title="Tests by day"
					dataset={{ source: stats }}
					tooltip={{ trigger: 'axis' }}
					legend={{}}
					dataZoom={[{}, { type: 'inside' }]}
					xAxis={{ type: 'time', name: 'Date' }}
					yAxis={[
						{ type: 'value', name: 'Tests' },
						{ id: 'passrate', type: 'value', name: 'Pass rate' }
					]}
					series={[
						{
							type: 'line',
							name: 'OK',
							color: COLOR_MAP.get('ok'),
							encode: { x: 'date', y: 'ok' },
							emphasis: { focus: 'series' }
						},
						{
							type: 'line',
							name: 'NOK',
							color: COLOR_MAP.get('nok'),
							encode: { x: 'date', y: 'nok' },
							emphasis: { focus: 'series' }
						},
						{
							yAxisId: 'passrate',
							type: 'line',
							name: 'Pass Rate',
							encode: { x: 'date', y: 'passrate' },
							tooltip: { valueFormatter: (v) => `${v}%` }
						}
					]}
					ref={lineRef}
				/>
			</div>
		</section>
	);
};
