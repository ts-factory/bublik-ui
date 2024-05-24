/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { cn } from '@/shared/tailwind-ui';

interface RunReportTableProps {
	data: Array<Array<string | number>>;
}

function RunReportTable({ data }: RunReportTableProps) {
	const header = data[0];
	const rows = data.slice(1);

	return (
		<div className="w-full self-start overflow-hidden flex h-full">
			<div className="bg-primary/20 w-1" />
			<table className="w-full relative h-max">
				<thead>
					<tr>
						{header.map((column, idx, arr) => (
							<th
								key={idx}
								className={cn(
									'border-b bg-primary-wash border-b-border-primary text-right text-[0.6875rem] font-semibold leading-[0.875rem] px-2 py-1 h-9',
									idx !== arr.length - 1 && 'border-r'
								)}
							>
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, rowIdx) => (
						<tr key={rowIdx}>
							{row.map((v, idx, cells) => (
								<td
									key={idx}
									className={cn(
										'border-border-primary text-right text-[0.625rem] font-semibold leading-[1.125rem] px-2 py-1 h-9',
										'border-b',
										idx !== cells.length - 1 && 'border-r'
									)}
								>
									{v}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export { RunReportTable };
