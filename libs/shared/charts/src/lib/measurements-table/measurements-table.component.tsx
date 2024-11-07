/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { memo, useState } from 'react';
import {
	useReactTable,
	getExpandedRowModel,
	getCoreRowModel,
	ExpandedState,
	flexRender
} from '@tanstack/react-table';

import { SingleMeasurementTable } from '@/services/bublik-api';
import { cn } from '@/shared/tailwind-ui';

import { MeasurementConfig } from '../constants';
import { columns } from './measurements-table.columns';

export interface MeasurementsTableProps {
	data: SingleMeasurementTable[];
}

export const MeasurementsTable = memo(({ data }: MeasurementsTableProps) => {
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const instance = useReactTable<SingleMeasurementTable>({
		data,
		columns,
		state: { expanded },
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		onExpandedChange: setExpanded
	});

	return (
		<table
			id={MeasurementConfig.tableId}
			className="w-full bg-white border-collapse rounded border-spacing-0"
		>
			<thead className="sticky top-0 z-20 bg-white after:w-full after:h-px after:absolute after:bg-border-primary">
				{instance.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id} className="h-8.5 bg-primary-wash">
						{headerGroup.headers.map((header) => {
							return (
								<th
									key={header.id}
									colSpan={header.colSpan}
									className="text-left text-[0.6875rem] font-semibold leading-[0.875rem] first:pl-4"
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
										  )}
								</th>
							);
						})}
					</tr>
				))}
			</thead>
			<tbody className="relative before:bg-[#ecf1ff] before:h-full before:w-1 before:left-0 before:top-0 before:z-10 before:absolute children-but-last:border-b children-but-last:border-b-border-primary">
				{instance.getRowModel().rows.map((row) => (
					<tr key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<td
								key={cell.id}
								className={cn(
									'text-[0.625rem] font-medium leading-[0.75rem] first:pl-4 h-9',
									cell.column.columnDef.meta?.className as string
								)}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
});
