/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

import { BublikEmptyState } from '@/bublik/features/ui-state';
import { BarChart } from '@/shared/charts';
import { AnalyticsCharts } from '@/shared/types';
import { CardHeader, cn, RunModeToggle, Spinner } from '@/shared/tailwind-ui';

import {
	formatAxisLabel,
	getEventNameChartColor,
	getPathChartColor,
	mergeTopPathsByPath
} from '../admin-analytics-page.utils';

interface AnalyticsChartsSectionProps {
	charts?: AnalyticsCharts;
	isChartsExposed: boolean;
	isChartsLoading: boolean;
	onToggleCharts: () => void;
	onPagePathClick: (path: string) => void;
	onEventNameClick: (eventName: string) => void;
}

interface ChartClickEvent {
	dataIndex?: number;
}

function AnalyticsChartsSection(props: AnalyticsChartsSectionProps) {
	const {
		charts,
		isChartsExposed,
		isChartsLoading,
		onToggleCharts,
		onPagePathClick,
		onEventNameClick
	} = props;

	const normalizedTopPaths = useMemo(
		() => mergeTopPathsByPath(charts?.top_paths ?? []),
		[charts?.top_paths]
	);

	const pageChartEvents = useMemo(
		() => ({
			click: (event: ChartClickEvent) => {
				if (typeof event.dataIndex !== 'number') {
					return;
				}

				const selectedPath = normalizedTopPaths[event.dataIndex]?.path;
				if (!selectedPath) {
					return;
				}

				onPagePathClick(selectedPath);
			}
		}),
		[normalizedTopPaths, onPagePathClick]
	);

	const eventChartEvents = useMemo(
		() => ({
			click: (event: ChartClickEvent) => {
				if (typeof event.dataIndex !== 'number') {
					return;
				}

				const selectedEventName =
					charts?.top_events[event.dataIndex]?.event_name;
				if (!selectedEventName) {
					return;
				}

				onEventNameClick(selectedEventName);
			}
		}),
		[charts?.top_events, onEventNameClick]
	);

	return (
		<div className="bg-white rounded-md overflow-hidden isolate">
			<CardHeader
				label="Charts"
				className={cn(!isChartsExposed && 'border-transparent')}
			>
				<RunModeToggle
					isFullMode={isChartsExposed}
					onToggleClick={onToggleCharts}
				/>
			</CardHeader>
			{isChartsExposed ? (
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-1 p-2 min-h-[280px]">
					<div className="bg-white border-r border-border-primary">
						{isChartsLoading ? (
							<div className="h-[260px] grid place-items-center">
								<Spinner className="h-12" />
							</div>
						) : normalizedTopPaths.length ? (
							<BarChart
								title="Most Visited Pages"
								onEvents={pageChartEvents}
								xAxis={{
									type: 'category',
									data: normalizedTopPaths.map((item) =>
										formatAxisLabel(item.path)
									),
									axisLabel: { interval: 0, rotate: 25 }
								}}
								yAxis={{ type: 'value', name: 'Views' }}
								series={[
									{
										type: 'bar',
										barWidth: 18,
										cursor: 'pointer',
										data: normalizedTopPaths.map((item) => ({
											value: item.count,
											itemStyle: { color: getPathChartColor(item.path) }
										}))
									}
								]}
								style={{ height: 260 }}
							/>
						) : (
							<BublikEmptyState
								title="No page view data"
								description="Page visits will appear here"
								hideIcon
								className="h-[260px]"
							/>
						)}
					</div>

					<div className="bg-white rounded-md">
						{isChartsLoading ? (
							<div className="h-[220px] grid place-items-center">
								<Spinner className="h-12" />
							</div>
						) : charts?.top_events.length ? (
							<BarChart
								title="Top Events"
								onEvents={eventChartEvents}
								xAxis={{
									type: 'category',
									data: charts.top_events.map((item) =>
										formatAxisLabel(item.event_name)
									),
									axisLabel: { interval: 0, rotate: 20 }
								}}
								yAxis={{ type: 'value', name: 'Events' }}
								series={[
									{
										type: 'bar',
										barWidth: 18,
										cursor: 'pointer',
										data: charts.top_events.map((item) => ({
											value: item.count,
											itemStyle: {
												color: getEventNameChartColor(item.event_name)
											}
										}))
									}
								]}
								style={{ height: 220 }}
							/>
						) : (
							<BublikEmptyState
								title="No custom events"
								description="Custom events for this selection will appear here"
								hideIcon
								className="h-[220px]"
							/>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}

export { AnalyticsChartsSection };
