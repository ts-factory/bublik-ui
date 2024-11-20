/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment, ReactNode, useRef } from 'react';
import { flexRender, Row } from '@tanstack/react-table';

import { cn } from '@/shared/tailwind-ui';
import { MergedRun, NodeEntity, RunData } from '@/shared/types';

export interface RowProps {
	row: Row<RunData | MergedRun>;
	renderSubRow: (row: Row<RunData | MergedRun>) => ReactNode;
}

export const RunRow = ({ row, renderSubRow }: RowProps) => {
	const ref = useRef<HTMLTableRowElement>(null);

	const isExpanded = row.getIsExpanded();
	const isTest = row.original?.type === NodeEntity.Test;
	const isExpandedTest = isTest && isExpanded;

	return (
		<Fragment>
			<tr
				className={cn(
					'[&>*]:hover:bg-gray-50',
					isExpandedTest && 'sticky top-[33px] z-10 [&>*]:bg-gray-50'
				)}
				ref={ref}
			>
				{row.getVisibleCells().map((cell) => {
					const parentIndex = cell.column.parent?.columns?.findIndex(
						(c) => c.id === cell.column.id
					);

					const isLast =
						cell.column.parent?.columns?.length ?? 0 - 1 === parentIndex;

					return (
						<td
							key={cell.id}
							className={cn(
								'px-4 py-0 bg-white',
								isLast && 'border-r',
								cell.column.columnDef.meta?.className
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</td>
					);
				})}
			</tr>
			{row.getIsExpanded() && row.original?.type === NodeEntity.Test ? (
				<tr role="row">
					<td colSpan={row.getVisibleCells().length}>{renderSubRow(row)}</td>
				</tr>
			) : null}
		</Fragment>
	);
};
