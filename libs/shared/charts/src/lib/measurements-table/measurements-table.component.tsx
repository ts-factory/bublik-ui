/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	useReactTable,
	getCoreRowModel,
	flexRender
} from '@tanstack/react-table';

import { SingleMeasurementTable } from '@/services/bublik-api';

import { MeasurementConfig } from '../constants';
import { getHeaderStickyProps, getSubrowStickyProps } from '../utils';
import { columns } from './measurements-table.columns';

export interface MeasurementsTableProps {
	data: SingleMeasurementTable[];
	isLockedMode?: boolean;
	chartsHeight?: number;
}

export const MeasurementsTable = ({
	data,
	isLockedMode,
	chartsHeight
}: MeasurementsTableProps) => {
	const instance = useReactTable<SingleMeasurementTable>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<table
			id={MeasurementConfig.tableId}
			className="w-full bg-white border-collapse rounded border-spacing-0"
		>
			<thead
				style={getHeaderStickyProps({ isLockedMode, height: chartsHeight })}
				className="sticky top-0 z-20 bg-white after:w-full after:h-px after:absolute after:bg-border-primary"
			>
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
					<tr
						key={row.id}
						style={getSubrowStickyProps({
							isLockedMode,
							height: chartsHeight
						})}
						className="relative z-10 h-9"
					>
						{row.getVisibleCells().map((cell) => (
							<td
								key={cell.id}
								className="text-[0.625rem] font-medium leading-[0.75rem] first:pl-4"
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};
