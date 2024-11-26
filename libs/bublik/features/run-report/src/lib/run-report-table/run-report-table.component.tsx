import { useParams } from 'react-router-dom';

import { ReportTable } from '@/shared/types';
import { cn, cva } from '@/shared/tailwind-ui';

import { RunReportPointDialog } from '../run-report-point-dialog';

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
			'border-b bg-primary-wash border-border-primary text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1 whitespace-nowrap'
		)
	]
});

function formatValue(
	value: string | number | undefined,
	seriesName: string,
	formatters?: Record<string, string>
) {
	if (value === undefined || value === null) return <>&ndash;</>;

	const formatter = formatters?.[seriesName] ?? '';

	return `${Number(value)}${formatter}`;
}

function getValue(
	xValue: number | string,
	seriesName: string,
	xAxisKey: string,
	table: ReportTable
): string | number | undefined {
	const series = table.data.find((s) => s.series === seriesName);

	return series?.points.find((p) => {
		const value = p[xAxisKey!];

		return value.toString() === xValue.toString();
	})?.['y_value'];
}

function getMetadata(
	xValue: number | string,
	seriesName: string,
	xAxisKey: string,
	table: ReportTable
) {
	const series = table.data.find((s) => s.series === seriesName);

	return series?.points.find((p) => {
		const value = p[xAxisKey!];

		return value.toString() === xValue.toString();
	})?.metadata;
}

function getTableDerivedData(table: ReportTable) {
	const X_AXIS_KEY = 'x_value';

	const xValues = Array.from(
		new Set(
			table.data.flatMap((series) =>
				series.points.map((point) => point[X_AXIS_KEY])
			)
		)
	);
	const seriesNames = table.data.map((series) => series.series);

	return {
		seriesNames,
		xValues,
		xAxisKey: X_AXIS_KEY
	};
}

interface RunReportTableProps {
	table: ReportTable;
}

function RunReportTable({ table }: RunReportTableProps) {
	const { runId } = useParams<{ runId: string }>();

	if (!table.data.length) return null;

	if (table.data.length === 1) {
		return <SingleSeriesTable table={table} runId={Number(runId)} />;
	}

	return <MultipleSeriesTable table={table} runId={Number(runId)} />;
}

interface SingleSeriesTableProps {
	runId: number;
	table: ReportTable;
}

function SingleSeriesTable({ table, runId }: SingleSeriesTableProps) {
	const { seriesNames, xValues, xAxisKey } = getTableDerivedData(table);

	return (
		<table className="w-full relative border-separate border-spacing-0">
			<thead className="sticky top-0">
				<tr>
					{seriesNames.map((seriesName, idx, arr) => (
						<th
							key={seriesName}
							className={headerCellStyles({
								className: `text-right border-r h-9 ${
									idx !== arr.length - 1 && 'border-r'
								}`
							})}
							rowSpan={2}
						>
							{seriesName}
						</th>
					))}
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
						<td className={cn(cellStyles(), 'border-r text-right')}>
							{xValue}
						</td>
						{seriesNames.map((seriesName) => {
							const metadata = getMetadata(xValue, seriesName, xAxisKey, table);

							return (
								<RunReportPointDialog
									key={`${xValue}-${seriesName}`}
									runId={runId}
									resultId={metadata?.result_id}
								>
									<td
										className={cn(
											cellStyles({ isCellWithMeta: Boolean(metadata) }),
											seriesName !== seriesNames[seriesNames.length - 1] &&
												'border-r'
										)}
									>
										{formatValue(
											getValue(xValue, seriesName, xAxisKey, table),
											seriesName,
											table.formatters
										)}
									</td>
								</RunReportPointDialog>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

interface MultipleSeriesTableProps {
	runId: number;
	table: ReportTable;
}

function MultipleSeriesTable({ table, runId }: MultipleSeriesTableProps) {
	const { xAxisKey, seriesNames, xValues } = getTableDerivedData(table);

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
						{table.labels?.['y_value'] ?? 'Value'}
					</th>
					<th
						className={headerCellStyles({ className: 'h-9 text-center' })}
						colSpan={table.data.length}
					>
						{table.labels?.['series'] ?? 'Series'}
					</th>
				</tr>
				<tr>
					{seriesNames.map((seriesName, idx, arr) => (
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
						{table.labels?.[xAxisKey!] || ''}
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
						{seriesNames.map((seriesName) => {
							const metadata = getMetadata(xValue, seriesName, xAxisKey, table);

							return (
								<RunReportPointDialog
									key={`${xValue}-${seriesName}`}
									runId={runId}
									resultId={metadata?.result_id}
								>
									<td
										className={cn(
											cellStyles({ isCellWithMeta: Boolean(metadata) }),
											seriesName !== seriesNames[seriesNames.length - 1] &&
												'border-r'
										)}
									>
										{formatValue(
											getValue(xValue, seriesName, xAxisKey, table),
											seriesName,
											table.formatters
										)}
									</td>
								</RunReportPointDialog>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export { RunReportTable };
