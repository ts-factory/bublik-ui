/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { format } from 'date-fns';

import { EChartsOption, chartStyles } from '@/shared/charts';
import { getRunStatusInfo } from '@/shared/tailwind-ui';
import { RUN_STATUS } from '@/shared/types';

import { COLOR_MAP } from './runs-stats.component.utils';
import { RunsChartBucket } from './runs-stats.types';
import { RunsChartPeriod } from './runs-stats.utils';

const AXIS_LABEL_FORMAT: Record<RunsChartPeriod, string> = {
	day: 'MMM d',
	week: 'MMM d',
	month: 'MMM yyyy'
};

const TOOLTIP_TITLE_FORMAT: Record<RunsChartPeriod, string> = {
	day: 'EEE, MMM d, yyyy',
	week: "'Week of' MMM d, yyyy",
	month: 'MMMM yyyy'
};

/** Past this many periods the timelines get a zoom slider */
const SLIDER_MIN_BUCKETS = 24;

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact' });
const fullNumber = new Intl.NumberFormat('en');

function getStatusLabel(status: RUN_STATUS): string {
	return getRunStatusInfo(status).label.toUpperCase();
}

function getStatusCount(buckets: RunsChartBucket[], status: RUN_STATUS) {
	return buckets.reduce(
		(total, bucket) => total + bucket.runIdsByStatus[status].length,
		0
	);
}

/** Statuses that have at least one run, most frequent first */
function getPresentStatuses(buckets: RunsChartBucket[]) {
	return Object.values(RUN_STATUS)
		.map((status) => ({ status, count: getStatusCount(buckets, status) }))
		.filter(({ count }) => count > 0)
		.sort((left, right) => right.count - left.count);
}

function formatBucketTitle(date: Date, period: RunsChartPeriod): string {
	return format(date, TOOLTIP_TITLE_FORMAT[period]);
}

interface TooltipRow {
	marker: string;
	label: string;
	value: string;
}

function renderTooltip(title: string, rows: TooltipRow[], empty: string) {
	const body = rows.length
		? rows
				.map(
					(row) =>
						`<div style="display:flex;align-items:center;gap:16px;justify-content:space-between">` +
						`<span>${row.marker}${row.label}</span>` +
						`<span style="font-weight:600">${row.value}</span></div>`
				)
				.join('')
		: `<div>${empty}</div>`;

	return `<div style="font-weight:600;margin-bottom:4px">${title}</div>${body}`;
}

interface AxisTooltipParam {
	dataIndex: number;
	marker?: string;
	seriesId?: string;
	seriesName?: string;
	value?: unknown;
}

function asParams(params: unknown): AxisTooltipParam[] {
	return (Array.isArray(params) ? params : [params]) as AxisTooltipParam[];
}

function getTimelineBase(
	buckets: RunsChartBucket[],
	period: RunsChartPeriod
): EChartsOption {
	const withSlider = buckets.length > SLIDER_MIN_BUCKETS;

	return {
		legend: {
			type: 'scroll',
			top: 0,
			left: 0,
			icon: 'roundRect',
			itemWidth: 10,
			itemHeight: 10,
			textStyle: chartStyles.text
		},
		grid: {
			top: 40,
			left: 8,
			right: 8,
			bottom: withSlider ? 44 : 8,
			containLabel: true
		},
		dataZoom: withSlider
			? [
					{ type: 'inside' },
					{ type: 'slider', height: 18, bottom: 8, showDetail: false }
			  ]
			: [{ type: 'inside' }],
		xAxis: {
			type: 'category',
			data: buckets.map((bucket) =>
				format(bucket.date, AXIS_LABEL_FORMAT[period])
			),
			axisTick: { alignWithLabel: true },
			axisLabel: { hideOverlap: true }
		}
	};
}

function getConclusionTotalsOption(buckets: RunsChartBucket[]): EChartsOption {
	const statuses = getPresentStatuses(buckets);
	const total = statuses.reduce((sum, { count }) => sum + count, 0);

	return {
		tooltip: { show: false },
		grid: { top: 0, left: 8, right: 72, bottom: 0, containLabel: true },
		xAxis: { type: 'value', show: false },
		yAxis: {
			type: 'category',
			inverse: true,
			data: statuses.map(({ status }) => getStatusLabel(status)),
			axisLine: { show: false },
			axisTick: { show: false }
		},
		series: [
			{
				type: 'bar',
				id: 'conclusion-totals',
				barMaxWidth: 18,
				cursor: 'pointer',
				data: statuses.map(({ status, count }) => ({
					value: count,
					itemStyle: {
						color: getRunStatusInfo(status).bgRaw,
						borderRadius: 3
					}
				})),
				label: {
					show: true,
					position: 'right',
					...chartStyles.text,
					// The default halo smears the text on the dark surface
					textBorderWidth: 0,
					formatter: ({ value }) =>
						`${value} · ${Math.round((Number(value) * 100) / total)}%`
				}
			}
		]
	};
}

function getConclusionTimelineOption(
	buckets: RunsChartBucket[],
	period: RunsChartPeriod
): EChartsOption {
	// Least frequent on top of the stack, in the order of the totals chart
	const statuses = getPresentStatuses(buckets);

	return {
		...getTimelineBase(buckets, period),
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			textStyle: chartStyles.text,
			extraCssText: chartStyles.tooltip,
			formatter: (params: unknown) => {
				const items = asParams(params);
				const bucket = buckets[items[0]?.dataIndex ?? 0];
				const rows = items
					.filter((item) => Number(item.value) > 0)
					.map((item) => ({
						marker: item.marker ?? '',
						label: item.seriesName ?? '',
						value: String(item.value)
					}));
				const total = rows.reduce((sum, row) => sum + Number(row.value), 0);

				if (rows.length > 1) {
					rows.push({ marker: '', label: 'Total', value: String(total) });
				}

				return renderTooltip(
					formatBucketTitle(bucket.date, period),
					rows,
					'No runs'
				);
			}
		},
		yAxis: { type: 'value', minInterval: 1 },
		series: statuses.map(({ status }) => ({
			type: 'bar',
			id: status,
			name: getStatusLabel(status),
			stack: 'runs',
			color: getRunStatusInfo(status).bgRaw,
			barMaxWidth: 48,
			cursor: 'pointer',
			emphasis: { focus: 'series' },
			data: buckets.map((bucket) => bucket.runIdsByStatus[status].length)
		}))
	};
}

function getTestsTimelineOption(
	buckets: RunsChartBucket[],
	period: RunsChartPeriod
): EChartsOption {
	return {
		...getTimelineBase(buckets, period),
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			textStyle: chartStyles.text,
			extraCssText: chartStyles.tooltip,
			formatter: (params: unknown) => {
				const items = asParams(params);
				const bucket = buckets[items[0]?.dataIndex ?? 0];
				const marker = (id: string) =>
					items.find((item) => item.seriesId === id)?.marker ?? '';
				const { ok, nok, total, passrate } = bucket.tests;

				return renderTooltip(
					formatBucketTitle(bucket.date, period),
					total
						? [
								{
									marker: marker('ok'),
									label: 'OK',
									value: fullNumber.format(ok)
								},
								{
									marker: marker('nok'),
									label: 'NOK',
									value: fullNumber.format(nok)
								},
								{
									marker: marker('passrate'),
									label: 'Pass rate',
									value: `${passrate}%`
								}
						  ]
						: [],
					'No tests'
				);
			}
		},
		yAxis: [
			{
				type: 'value',
				axisLabel: {
					formatter: (value: number) => compactNumber.format(value)
				}
			},
			{
				type: 'value',
				min: 0,
				max: 100,
				interval: 25,
				// The left axis draws the grid; two sets of lines never line up
				splitLine: { show: false },
				axisLabel: { formatter: '{value}%' }
			}
		],
		series: [
			{
				type: 'bar',
				id: 'ok',
				name: 'OK',
				stack: 'tests',
				color: COLOR_MAP.get('ok'),
				barMaxWidth: 48,
				cursor: 'pointer',
				emphasis: { focus: 'series' },
				data: buckets.map((bucket) => bucket.tests.ok)
			},
			{
				type: 'bar',
				id: 'nok',
				name: 'NOK',
				stack: 'tests',
				color: COLOR_MAP.get('nok'),
				barMaxWidth: 48,
				cursor: 'pointer',
				emphasis: { focus: 'series' },
				data: buckets.map((bucket) => bucket.tests.nok)
			},
			{
				type: 'line',
				id: 'passrate',
				name: 'Pass rate',
				yAxisIndex: 1,
				color: COLOR_MAP.get('passrate'),
				symbolSize: 6,
				lineStyle: { width: 2 },
				// '-' is a missing value: the line breaks over periods without tests
				data: buckets.map((bucket) => bucket.tests.passrate ?? '-')
			}
		]
	};
}

export {
	getConclusionTimelineOption,
	getConclusionTotalsOption,
	getPresentStatuses,
	getTestsTimelineOption
};
