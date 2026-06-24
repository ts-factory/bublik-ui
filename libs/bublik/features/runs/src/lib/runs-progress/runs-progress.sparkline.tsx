/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { memo, useMemo, useState } from 'react';

import { EChartsOption, Plot, chartStyles } from '@/shared/charts';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';
import { Icon, cn } from '@/shared/tailwind-ui';

const OK_COLOR = '#65cd84';
const NOK_COLOR = '#f95c78';

type SparklinePoint = {
	present: boolean;
	total: number;
	nok: number;
	unexpected: number;
	abnormal: number;
	runId: number;
	resultId: number | null;
	runStart: string;
};

interface SparklineProps {
	points: SparklinePoint[];
	width?: number;
	height?: number;
	className?: string;
}

function SparklineImpl(props: SparklineProps) {
	const { points, width = 72, height = 22, className } = props;

	const geometry = useMemo(() => {
		const present = points.filter((point) => point.present);

		if (present.length === 0) return null;

		const maxTotal = Math.max(1, ...points.map((point) => point.total));
		const stepX = points.length > 1 ? width / (points.length - 1) : 0;

		function toX(index: number): number {
			return points.length > 1 ? index * stepX : width / 2;
		}

		function toY(value: number): number {
			const ratio = value / maxTotal;

			return height - ratio * (height - 2) - 1;
		}

		const coords = points.map((point, index) => ({
			x: toX(index),
			totalY: toY(point.total),
			nokY: toY(point.nok),
			present: point.present,
			nok: point.nok
		}));

		const totalLine = coords
			.map(
				(coord, index) =>
					`${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.totalY}`
			)
			.join(' ');

		const nokArea =
			`M ${coords[0].x} ${height} ` +
			coords.map((coord) => `L ${coord.x} ${coord.nokY}`).join(' ') +
			` L ${coords[coords.length - 1].x} ${height} Z`;

		const latest = coords[0];

		return { coords, totalLine, nokArea, latest };
	}, [points, width, height]);

	if (!geometry) {
		return (
			<span className={cn('text-[0.625rem] text-text-secondary', className)}>
				—
			</span>
		);
	}

	const { totalLine, nokArea, latest } = geometry;

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			className={cn('overflow-visible', className)}
			role="img"
			aria-label="Result trend across runs"
		>
			<path d={nokArea} fill={NOK_COLOR} fillOpacity={0.18} stroke="none" />
			<path
				d={totalLine}
				fill="none"
				stroke={OK_COLOR}
				strokeWidth={1.5}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<circle
				cx={latest.x}
				cy={latest.totalY}
				r={1.75}
				fill={latest.nok > 0 ? NOK_COLOR : OK_COLOR}
			/>
		</svg>
	);
}

const Sparkline = memo(SparklineImpl);

function formatRunDate(value: string): string {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString();
}

interface SparklineHoverChartProps {
	points: SparklinePoint[];
	onPointClick: (index: number) => void;
}

const CHART_WIDTH = 360;
const CHART_HEIGHT = 132;

type SparklineChartEvent = { dataIndex?: number };

function SparklineHoverChart({
	points,
	onPointClick
}: SparklineHoverChartProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const hasData = points.some((point) => point.present);
	const maxTotal = useMemo(
		() => Math.max(1, ...points.map((point) => point.total)),
		[points]
	);

	const options = useMemo<EChartsOption>(() => {
		const totalData = points.map((point) =>
			point.present ? point.total : '-'
		);
		const nokData = points.map((point) => (point.present ? point.nok : '-'));

		return {
			animation: false,
			grid: { left: 6, right: 6, top: 8, bottom: 6, containLabel: false },
			xAxis: {
				type: 'category',
				data: points.map((point) => String(point.runId)),
				boundaryGap: true,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { show: false },
				splitLine: { show: false },
				axisPointer: { show: true, type: 'line', label: { show: false } }
			},
			yAxis: {
				type: 'value',
				min: 0,
				max: maxTotal,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { show: false },
				splitLine: { show: false }
			},
			tooltip: {
				trigger: 'axis',
				showContent: false,
				axisPointer: { type: 'line' },
				textStyle: chartStyles.text
			},
			series: [
				{
					id: 'nok',
					name: 'Unexpected + abnormal',
					type: 'line',
					data: nokData,
					symbol: 'none',
					lineStyle: { width: 0 },
					areaStyle: { color: NOK_COLOR, opacity: 0.18 },
					silent: true,
					z: 1
				},
				{
					id: 'total',
					name: 'Total',
					type: 'line',
					data: totalData,
					symbol: 'circle',
					symbolSize: 5,
					showSymbol: false,
					lineStyle: { color: OK_COLOR, width: 1.5 },
					itemStyle: { color: OK_COLOR },
					silent: true,
					z: 2
				},
				{
					id: 'hit',
					name: 'hit',
					type: 'bar',
					data: points.map(() => maxTotal),
					barWidth: '100%',
					barCategoryGap: '0%',
					itemStyle: { color: 'transparent' },
					emphasis: { disabled: true },
					cursor: 'pointer',
					z: 3
				}
			]
		};
	}, [points, maxTotal]);

	const onEvents = useMemo(
		() => ({
			click: (event: SparklineChartEvent) => {
				if (typeof event.dataIndex === 'number') onPointClick(event.dataIndex);
			},
			mouseover: (event: SparklineChartEvent) => {
				if (typeof event.dataIndex === 'number')
					setHoveredIndex(event.dataIndex);
			}
		}),
		[onPointClick]
	);

	const active = hoveredIndex !== null ? points[hoveredIndex] ?? null : null;

	return (
		<div className="w-[360px] rounded-md border border-border-primary bg-white p-2 shadow-popover">
			<div className="mb-1.5 flex min-h-[2.25rem] items-start justify-between gap-2 text-[0.6875rem] leading-tight">
				{active ? (
					<>
						<div className="flex min-w-0 flex-col">
							<span className="font-semibold text-text-primary">
								#{active.runId} · {formatRunDate(active.runStart)}
							</span>
							<span className="text-text-secondary">
								total {active.total} ·{' '}
								<span className="text-text-unexpected">
									unexpected {active.unexpected}
								</span>{' '}
								· abnormal {active.abnormal}
							</span>
						</div>
						{active.resultId !== null ? (
							<LinkWithProject
								to={routes.run({
									runId: active.runId,
									targetIterationId: active.resultId
								})}
								className="inline-flex shrink-0 items-center gap-1 rounded bg-primary-wash px-1.5 py-1 font-medium text-primary hover:bg-primary hover:text-white"
							>
								<Icon name="BoxArrowRight" size={12} />
								Open
							</LinkWithProject>
						) : null}
					</>
				) : (
					<span className="text-text-secondary">
						Hover a run for its counts · click to jump to that cell
					</span>
				)}
			</div>
			{hasData ? (
				<Plot
					options={options}
					onEvents={onEvents}
					style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
				/>
			) : (
				<div
					className="grid place-items-center text-xs text-text-secondary"
					style={{ height: CHART_HEIGHT }}
				>
					No trend data
				</div>
			)}
		</div>
	);
}

export { Sparkline, SparklineHoverChart };
export type { SparklinePoint };
