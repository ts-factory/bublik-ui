/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';
import { ECElementEvent } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { toast } from 'sonner';

import { BarChart, LineChart } from '@/shared/charts';
import { useNavigateWithProject } from '@/bublik/features/projects';

import { COLOR_MAP, getGroupedByDay } from '../runs-stats.component.utils';
import { RunStats, TestByWeekDaySchema } from '../runs-stats.types';
import { RunsListModal } from './runs-list.component';

interface HandlePointClickProps {
	onRunListOpen: (ids: string[]) => void;
}

function useHandlePointClick({ onRunListOpen }: HandlePointClickProps) {
	const navigate = useNavigateWithProject();
	const ref = useRef<ReactEChartsCore>(null);

	useEffect(() => {
		const instance = ref.current?.getEchartsInstance();
		if (!instance || instance.isDisposed()) return;

		const handleClick = (params: ECElementEvent) => {
			const result = TestByWeekDaySchema.safeParse(params.data ?? params.value);

			if (!result.success) {
				toast.error('Failed to parse run stat data');
				return;
			}

			onRunListOpen(result.data.ids.split(','));
		};

		instance.on('click', handleClick);

		return () => {
			if (instance.isDisposed()) return;

			instance.off('click', handleClick);
		};
	}, [navigate, onRunListOpen]);

	return { ref };
}

interface DaySectionProps {
	stats: RunStats[];
}

export const DaySection = ({ stats }: DaySectionProps) => {
	const groupedByDay = getGroupedByDay(stats);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [runIds, setRunIds] = useState<string[]>([]);

	const handleOpenChange = (open: boolean) => {
		if (!open) setRunIds([]);

		setIsModalOpen(open);
	};

	const handleRunListOpen = (ids: string[]) => {
		setRunIds(ids);
		setIsModalOpen(true);
	};

	const { ref: lineRef } = useHandlePointClick({
		onRunListOpen: handleRunListOpen
	});
	const { ref: barRef } = useHandlePointClick({
		onRunListOpen: handleRunListOpen
	});

	return (
		<section className="">
			<RunsListModal
				ids={runIds}
				open={isModalOpen}
				onOpenChange={handleOpenChange}
			/>
			<div className="px-4 py-2 border-b border-b-border-primary">
				<BarChart
					title="Tests by day"
					dataset={{ source: groupedByDay }}
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
					ref={barRef}
				/>
			</div>
			<div className="px-4 py-2">
				<LineChart
					title="Tests by day"
					dataset={{ source: groupedByDay }}
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
