/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { cn } from '@/shared/tailwind-ui';

interface RunReportTableProps {
	data: Array<Array<string | number>>;
	formatters?: Record<string, string>;
}

function RunReportTable({ data, formatters }: RunReportTableProps) {
	const header = data?.[0] ?? [];
	const rows = data.slice(1);

	return (
		<table className="w-full relative">
			<thead className="pl-1">
				<tr>
					{header.map((column, idx, arr) => (
						<th
							key={idx}
							className={cn(
								'border-b bg-primary-wash border-b-border-primary text-right text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1 h-9',
								idx !== arr.length - 1 && 'border-r',
								'sticky top-0'
							)}
						>
							{column}
						</th>
					))}
				</tr>
			</thead>
			<tbody className="pl-1">
				{rows.map((row, rowIdx) => (
					<tr key={rowIdx}>
						{row.map((v, idx, cells) => {
							const formatter = formatters?.[header?.[idx]] ?? '';
							const formattedData =
								v !== '-' && v !== 'na' ? `${v}${formatter}` : `${v}`;

							return (
								<td
									key={idx}
									className={cn(
										'border-border-primary text-right text-[0.625rem] font-semibold leading-[1.125rem] px-2 py-1 h-9',
										'border-b w-[1%]',
										idx !== cells.length - 1 && 'border-r'
									)}
								>
									{formattedData}
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
