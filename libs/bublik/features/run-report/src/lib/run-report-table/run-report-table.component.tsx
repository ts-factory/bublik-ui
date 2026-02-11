/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ReportPoint, ReportTable } from '@/shared/types';
import { cn, cva } from '@/shared/tailwind-ui';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';

import { WarningsHoverCard } from '../run-report-warnings';
import { useEnablePairGainColumns } from './run-report-table.hooks';

const cellStyles = cva({
	base: [
		cn(
			'border-b border-border-primary text-right text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1 h-9'
		)
	],
	variants: {
		isCellWithMeta: { true: 'hover:bg-primary-wash cursor-pointer' }
	}
});

const headerCellStyles = cva({
	base: [
		cn(
			'border-b bg-primary-wash border-border-primary text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1'
		)
	]
});

function formatValue(
	value: string | number | undefined,
	seriesName?: string,
	formatters?: Record<string, string>
) {
	if (value === undefined || value === null) return <>&ndash;</>;

	const formatter = seriesName ? formatters?.[seriesName] ?? '' : '';

	return `${Number(value)}${formatter}`;
}

type PointIndex = Map<string, Map<string, ReportPoint>>;

function getPoint(
	xValue: number | string,
	pointIndex: PointIndex,
	seriesName?: string
) {
	return pointIndex.get(seriesName ?? '')?.get(xValue.toString());
}

function getTableDerivedData(table: ReportTable) {
	const X_AXIS_KEY = 'x_value';
	const xValues = new Set<number | string>();
	const pointIndex: PointIndex = new Map();

	for (const series of table.data) {
		const seriesName = series.series ?? '';

		if (pointIndex.has(seriesName)) continue;

		const pointsByXValue = new Map<string, ReportPoint>();

		for (const point of series.points) {
			const xValue = point[X_AXIS_KEY];

			xValues.add(xValue);
			pointsByXValue.set(xValue.toString(), point);
		}

		pointIndex.set(seriesName, pointsByXValue);
	}

	const seriesNames = table.data.map((series) => series.series ?? '');

	return {
		seriesNames,
		xValues: Array.from(xValues),
		xAxisKey: X_AXIS_KEY,
		pointIndex
	};
}

interface RunReportTableProps {
	table: ReportTable;
}

function RunReportTable({ table }: RunReportTableProps) {
	const { runId } = useParams<{ runId: string }>();
	const [enablePairGainColumns] = useEnablePairGainColumns();
	const [previewResultId, setPreviewResultId] = useState<number>();
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const handlePreviewOpen = useCallback((resultId?: number) => {
		if (!resultId) return;

		setPreviewResultId(resultId);
		setIsPreviewOpen(true);
	}, []);

	const handlePreviewOpenChange = useCallback((open: boolean) => {
		setIsPreviewOpen(open);

		if (!open) {
			setPreviewResultId(undefined);
		}
	}, []);

	if (!table.data.length) return null;

	if (table.data.length === 1) {
		return (
			<>
				<LogPreviewContainer
					runId={Number(runId)}
					resultId={previewResultId}
					measurementId={previewResultId}
					open={isPreviewOpen}
					onOpenChange={handlePreviewOpenChange}
				/>
				<SingleSeriesTable table={table} onPreviewOpen={handlePreviewOpen} />
			</>
		);
	}

	return (
		<>
			<LogPreviewContainer
				runId={Number(runId)}
				resultId={previewResultId}
				measurementId={previewResultId}
				open={isPreviewOpen}
				onOpenChange={handlePreviewOpenChange}
			/>
			<MultipleSeriesTable
				table={table}
				enablePairGainColumns={enablePairGainColumns}
				onPreviewOpen={handlePreviewOpen}
			/>
		</>
	);
}

interface SingleSeriesTableProps {
	table: ReportTable;
	onPreviewOpen?: (resultId?: number) => void;
}

function SingleSeriesTable(props: SingleSeriesTableProps) {
	const { table, onPreviewOpen } = props;
	const { seriesNames, xValues, pointIndex } = getTableDerivedData(table);

	return (
		<table className="w-full relative border-separate border-spacing-0">
			<thead className="sticky top-0">
				<tr>
					{seriesNames.map((seriesName, idx, arr) => {
						return (
							<th
								key={idx}
								className={headerCellStyles({
									className: `text-right border-r h-9 ${
										idx !== arr.length - 1 && 'border-r'
									}`
								})}
								rowSpan={2}
							>
								<div className="flex items-center justify-between gap-2">
									{table.warnings.length ? (
										<WarningsHoverCard warnings={table.warnings} />
									) : (
										<div />
									)}
									<span>
										{idx === 0 && table?.labels?.['x_value']
											? table.labels['x_value']
											: seriesName}
									</span>
								</div>
							</th>
						);
					})}
					<th
						className={headerCellStyles({
							className: 'text-right'
						})}
					>
						{table.labels?.['y_value'] ?? 'y_value'}
					</th>
				</tr>
			</thead>
			<tbody>
				{xValues.map((xValue) => (
					<tr key={xValue}>
						<td className={cn(cellStyles(), 'border-r text-right', 'w-1/2')}>
							{xValue}
						</td>
						{seriesNames.map((seriesName) => {
							const point = getPoint(xValue, pointIndex, seriesName);
							const resultId = point?.metadata?.result_id;
							const isCellWithMeta = Boolean(resultId);

							return (
								<td
									key={`${xValue}-${seriesName}`}
									className={cn(
										cellStyles({ isCellWithMeta }),
										seriesName !== seriesNames[seriesNames.length - 1] &&
											'border-r',
										'w-1/2'
									)}
									onClick={
										isCellWithMeta ? () => onPreviewOpen?.(resultId) : undefined
									}
									onKeyDown={
										isCellWithMeta
											? (event) => {
													if (event.key !== 'Enter' && event.key !== ' ') {
														return;
													}

													event.preventDefault();
													onPreviewOpen?.(resultId);
											  }
											: undefined
									}
									tabIndex={isCellWithMeta ? 0 : undefined}
									role={isCellWithMeta ? 'button' : undefined}
								>
									{formatValue(point?.y_value, seriesName, table.formatters)}
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

interface MultipleSeriesTableProps {
	table: ReportTable;
	enablePairGainColumns?: boolean;
	onPreviewOpen?: (resultId?: number) => void;
}

function MultipleSeriesTable(props: MultipleSeriesTableProps) {
	const { table, enablePairGainColumns = false, onPreviewOpen } = props;
	const { xAxisKey, seriesNames, xValues, pointIndex } =
		getTableDerivedData(table);

	const sortedSeriesNames = useMemo(() => {
		if (!enablePairGainColumns) return seriesNames;

		const GAIN_POSTFIX = ' gain';

		const gainSeries: string[] = [];
		const baseSeries: string[] = [];

		seriesNames.forEach((name = '') => {
			if (name.includes(GAIN_POSTFIX)) {
				gainSeries.push(name);
			} else {
				baseSeries.push(name);
			}
		});

		const gainMap = new Map<string, string>();
		gainSeries.forEach((gain) => {
			const baseKey = gain.replace(GAIN_POSTFIX, '');
			gainMap.set(baseKey, gain);
		});

		const sorted: string[] = [];
		baseSeries.forEach((base) => {
			sorted.push(base);

			const gain = gainMap.get(base);
			if (gain) sorted.push(gain);
		});

		return sorted;
	}, [seriesNames, enablePairGainColumns]);

	return (
		<table className="w-full relative border-separate border-spacing-0">
			<thead className="sticky top-0">
				<tr>
					<th
						className={headerCellStyles({
							className: 'h-[72px] border-r text-right'
						})}
						style={{ width: '1%' }}
						rowSpan={2}
					>
						<span>{table.labels?.['y_value'] ?? 'Value'}</span>
					</th>
					<th
						className={headerCellStyles({ className: 'h-9 text-center' })}
						colSpan={table.data.length}
					>
						<div className="flex items-center justify-between">
							<div className="size-6">
								<WarningsHoverCard warnings={table.warnings} />
							</div>
							<span>{table.labels?.['series'] ?? 'Series'}</span>
							<div />
						</div>
					</th>
				</tr>
				<tr>
					{sortedSeriesNames.map((seriesName, idx, arr) => (
						<th
							key={seriesName}
							className={headerCellStyles({
								className: `h-full text-right ${
									idx !== arr.length - 1 && 'border-r'
								}`
							})}
							rowSpan={2}
						>
							{seriesName}
						</th>
					))}
				</tr>
				<tr>
					<th
						className={headerCellStyles({
							className: 'h-9 border-r text-right'
						})}
					>
						{table.labels?.[xAxisKey] || ''}
					</th>
				</tr>
			</thead>
			<tbody>
				{xValues.map((xValue) => (
					<tr key={xValue}>
						<td
							className={cn(
								cellStyles(),
								'border-r text-right bg-primary-wash'
							)}
						>
							{xValue}
						</td>
						{sortedSeriesNames.map((seriesName) => {
							const point = getPoint(xValue, pointIndex, seriesName);
							const resultId = point?.metadata?.result_id;
							const isCellWithMeta = Boolean(resultId);

							return (
								<td
									key={`${xValue}-${seriesName}`}
									className={cn(
										cellStyles({ isCellWithMeta }),
										seriesName !==
											sortedSeriesNames[sortedSeriesNames.length - 1] &&
											'border-r'
									)}
									onClick={
										isCellWithMeta ? () => onPreviewOpen?.(resultId) : undefined
									}
									onKeyDown={
										isCellWithMeta
											? (event) => {
													if (event.key !== 'Enter' && event.key !== ' ') {
														return;
													}

													event.preventDefault();
													onPreviewOpen?.(resultId);
											  }
											: undefined
									}
									tabIndex={isCellWithMeta ? 0 : undefined}
									role={isCellWithMeta ? 'button' : undefined}
								>
									{formatValue(point?.y_value, seriesName, table.formatters)}
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export { RunReportTable };
