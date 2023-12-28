/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties } from 'react';

import { EChartsType, getInstanceByDom } from '../echart';

/**
|--------------------------------------------------
| TYPES
|--------------------------------------------------
*/

export type RowClickConfig = {
	dataIndex: number;
	id?: string;
	isLockedMode?: boolean;
};

export type StickyConfig = {
	isLockedMode?: boolean;
	height?: number;
};

/**
|--------------------------------------------------
| UTILS
|--------------------------------------------------
*/

export const getChartInstance = (id: string) => {
	const el = document.querySelector(
		`[data-chart-id="${id}"] > [_echarts_instance_]`
	) as HTMLElement | null;

	if (!el) return;

	const instance = getInstanceByDom(el);

	return { instance, el };
};

export const scrollChartInfoView = (chartEl: HTMLElement) => {
	chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

export const zoomOnDataPoint = (
	instance: EChartsType,
	dataIndex: number,
	zoomLevel = 5
) => {
	instance.dispatchAction({
		type: 'dataZoom',
		startValue: dataIndex - zoomLevel,
		endValue: dataIndex + zoomLevel
	});

	instance.dispatchAction({
		type: 'showTip',
		seriesIndex: 0,
		dataIndex: dataIndex
	});
};

export const handleRowClick =
	({ id, dataIndex, isLockedMode }: RowClickConfig) =>
	() => {
		if (!id) return;

		const chartInfo = getChartInstance(id);

		if (!chartInfo) return;

		if (!isLockedMode) scrollChartInfoView(chartInfo.el);

		if (!chartInfo.instance) return;

		zoomOnDataPoint(chartInfo.instance, dataIndex);
	};

export const getHeaderStickyProps = ({
	isLockedMode,
	height
}: StickyConfig): CSSProperties | undefined => {
	if (!isLockedMode) return undefined;

	return {
		position: 'sticky',
		top: isLockedMode && height ? height - 36 : 36
	};
};

export const getSubrowStickyProps = ({
	isLockedMode,
	height
}: StickyConfig): CSSProperties | undefined => {
	if (!isLockedMode) return { position: 'sticky', top: 34 };

	return {
		position: 'sticky',
		top: isLockedMode && height ? height : 34
	};
};

const ROW_PULSE_ANIMATION = 'animate-row-pulse';

export const getRow = (dataIndex: number, chartId: string) => {
	return document.querySelector(
		`[data-index="${dataIndex}"][data-id="${chartId}"]`
	) as HTMLElement | null;
};

export const highlightRow = (el: HTMLElement) => {
	const removeHighlightFromAllRows = () => {
		const allRows = document.querySelectorAll('[data-result="true"]');
		allRows.forEach((el) => el.classList.remove(ROW_PULSE_ANIMATION));
	};

	const highlight = () => {
		el.classList.add(ROW_PULSE_ANIMATION);
		el.addEventListener(
			'animationend',
			() => el.classList.remove(ROW_PULSE_ANIMATION),
			{
				once: true
			}
		);
	};

	removeHighlightFromAllRows();
	highlight();
};

export const scrollToRow = (el: HTMLElement, isStickyMode?: boolean) => {
	el.scrollIntoView({
		behavior: 'smooth',
		block: isStickyMode ? 'end' : 'center'
	});
};
