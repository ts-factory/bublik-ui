/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, Fragment, memo, useCallback, useState } from 'react';
import {
	useReactTable,
	getExpandedRowModel,
	getCoreRowModel,
	ExpandedState,
	Row,
	flexRender
} from '@tanstack/react-table';

import { MeasurementPlot } from '@/shared/types';

import { MeasurementConfig } from '../constants';
import {
	getHeaderStickyProps,
	getSubrowStickyProps,
	handleRowClick
} from '../utils';
import { columns } from './measurements-table.columns';

export interface MeasurementsTableProps {
	data: MeasurementPlot[];
	isLockedMode?: boolean;
	chartsHeight?: number;
}

export const MeasurementsTable: FC<MeasurementsTableProps> = memo(
	({ data, isLockedMode, chartsHeight }) => {
		const [expanded, setExpaned] = useState<ExpandedState>({});

		const instance = useReactTable<MeasurementPlot>({
			data,
			columns,
			state: { expanded },
			getCoreRowModel: getCoreRowModel(),
			getExpandedRowModel: getExpandedRowModel(),
			onExpandedChange: setExpaned,
			getIsRowExpanded: (row) => !!row.original.dots.length
		});

		const renderSubRow = useCallback(
			(row: Row<MeasurementPlot>) => {
				const { dots, name, aggr, units, id } = row.original;

				return dots.map((point, dataIndex) => (
					<tr
						key={`$${id}_${dataIndex}`}
						data-result="true"
						data-id={id ?? name}
						data-index={dataIndex}
						onClick={handleRowClick({
							id: id || name,
							dataIndex,
							isLockedMode
						})}
						className="relative cursor-pointer h-9"
					>
						<td colSpan={4} />

						<td>
							<div className="flex items-center gap-3">
								<span className="text-[0.625rem] font-semibold leading-[1.125rem]">
									{aggr} &nbsp;
								</span>
								<span className="text-[0.625rem] font-medium leading-[1.125rem]">
									{point['value']} {units}
								</span>
							</div>
						</td>
					</tr>
				));
			},
			[isLockedMode]
		);

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
						<tr key={headerGroup.id} className="h-8.5">
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
					{instance.getRowModel().rows.map((row) => {
						const expandRow = row.getToggleExpandedHandler();

						return (
							<Fragment key={row.id}>
								<tr
									onClick={expandRow}
									style={getSubrowStickyProps({
										isLockedMode,
										height: chartsHeight
									})}
									className="relative z-10 h-9 bg-primary-wash"
								>
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											className="text-[0.75rem] leading-[1.125rem] font-medium first:pl-4"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</td>
									))}
								</tr>
								{row.getIsExpanded() ? renderSubRow(row) : null}
							</Fragment>
						);
					})}
				</tbody>
			</table>
		);
	}
);
