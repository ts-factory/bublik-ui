/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

interface EstimateLegendTopOffsetConfig {
	labels: string[];
	containerWidth?: number;
	legendTop?: number;
	leftPaddingPx?: number;
	rightPaddingPx?: number;
	itemGap?: number;
	itemIconWidth?: number;
	itemIconTextGap?: number;
	itemHeight?: number;
	lineHeight?: number;
	rowGap?: number;
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
	gridGap?: number;
	safetyRows?: number;
	safetyPaddingPx?: number;
	minTop?: number;
	maxTop?: number;
}

let measurementContext: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
	if (measurementContext) return measurementContext;
	if (typeof document === 'undefined') return null;

	const canvas = document.createElement('canvas');
	measurementContext = canvas.getContext('2d');

	return measurementContext;
}

function measureTextWidth(text: string, font: string): number {
	const context = getMeasurementContext();

	if (!context) return text.length * 7;

	context.font = font;
	return context.measureText(text).width;
}

function estimateLegendTopOffset(
	config: EstimateLegendTopOffsetConfig
): number {
	const {
		labels,
		containerWidth,
		legendTop = 8,
		leftPaddingPx = 0,
		rightPaddingPx = 0,
		itemGap = 12,
		itemIconWidth = 25,
		itemIconTextGap = 8,
		itemHeight = 14,
		lineHeight = 14,
		rowGap = 8,
		fontFamily = 'Inter',
		fontSize = 10,
		fontWeight = 500,
		gridGap = 12,
		safetyRows = 0,
		safetyPaddingPx = 0,
		minTop = 64,
		maxTop = 240
	} = config;

	if (!labels.length || !containerWidth || containerWidth <= 0) {
		return minTop;
	}

	const legendContentWidth = Math.max(
		containerWidth - leftPaddingPx - rightPaddingPx,
		120
	);
	const font = `${fontWeight} ${fontSize}px ${fontFamily}`;

	let rows = 1;
	let rowWidth = 0;

	labels.forEach((label) => {
		const textWidth = measureTextWidth(label, font);
		const legendItemWidth =
			itemIconWidth + itemIconTextGap + textWidth + itemGap;

		if (rowWidth === 0) {
			rowWidth = legendItemWidth;
			return;
		}

		if (rowWidth + legendItemWidth <= legendContentWidth) {
			rowWidth += legendItemWidth;
			return;
		}

		rows += 1;
		rowWidth = legendItemWidth;
	});

	const effectiveRows = rows + safetyRows;
	const rowHeight = Math.max(lineHeight, itemHeight);
	const legendHeight =
		effectiveRows * rowHeight + (effectiveRows - 1) * rowGap + safetyPaddingPx;
	const topOffset = legendTop + legendHeight + gridGap;

	return Math.max(minTop, Math.min(topOffset, maxTop));
}

export { estimateLegendTopOffset };
