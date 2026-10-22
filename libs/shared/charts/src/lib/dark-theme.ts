/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useTheme } from '@/shared/hooks';

import { twTheme } from './tw-theme';

// ECharts draws on a canvas and cannot read CSS variables, so the dark
// theme's neutrals are spelled out: they match the dark tokens in
// apps/bublik/src/styles/tailwind.css (shadcn/ui's neutral scale)
const TEXT = '#fafafa'; // --colors-text-primary
const MUTED = '#a1a1a1'; // --colors-text-menu
const SURFACE = '#171717'; // --colors-bg-elevated
const BORDER = '#2e2e2e'; // --colors-border-primary
const AXIS = '#404040';
const SPLIT = '#262626';

const axis = {
	axisLine: { lineStyle: { color: AXIS } },
	axisTick: { lineStyle: { color: AXIS } },
	axisLabel: { color: MUTED },
	splitLine: { lineStyle: { color: [SPLIT] } },
	splitArea: {
		areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] }
	},
	nameTextStyle: { color: MUTED }
};

const DARK_THEME_NAME = 'bublik-dark';

/** Used in place of the light theme while the app is dark */
const darkTheme = {
	color: [...twTheme.theme.color],
	backgroundColor: 'transparent',
	textStyle: { color: MUTED },
	title: { textStyle: { color: TEXT }, subtextStyle: { color: MUTED } },
	legend: { textStyle: { color: MUTED }, inactiveColor: '#525252' },
	tooltip: {
		backgroundColor: SURFACE,
		borderColor: BORDER,
		textStyle: { color: TEXT }
	},
	axisPointer: {
		lineStyle: { color: '#525252' },
		crossStyle: { color: '#525252' },
		label: { backgroundColor: '#262626', color: TEXT }
	},
	categoryAxis: axis,
	valueAxis: axis,
	logAxis: axis,
	timeAxis: axis,
	toolbox: {
		iconStyle: { borderColor: MUTED },
		emphasis: { iconStyle: { borderColor: TEXT } }
	},
	dataZoom: {
		borderColor: BORDER,
		backgroundColor: 'transparent',
		fillerColor: 'rgba(114,131,226,0.2)',
		dataBackground: {
			lineStyle: { color: AXIS },
			areaStyle: { color: SPLIT }
		},
		handleStyle: { color: MUTED, borderColor: AXIS },
		moveHandleStyle: { color: AXIS },
		textStyle: { color: MUTED }
	},
	// Pie slices are separated by a border in the surface colour
	pie: {
		itemStyle: { borderColor: SURFACE },
		// Outside labels get a light halo by default, which smears on dark
		label: { color: MUTED, textBorderWidth: 0, textBorderColor: 'transparent' }
	}
};

/** The chart surface, for slice borders and similar strokes set in options */
function useChartSurfaceColor(): string {
	return useTheme().resolvedTheme === 'dark' ? SURFACE : '#fff';
}

export { darkTheme, DARK_THEME_NAME, useChartSurfaceColor };
