/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, Fragment, ReactNode, useRef } from 'react';
import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@/shared/tailwind-ui';

import { NodeEntity, RunData } from '@/shared/types';

import { COLUMN_GROUPS } from '../../constants';
import { getIsBorderGroup } from '../../utils';

export interface RowProps {
	row: Row<RunData>;
	renderSubRow: (row: Row<RunData>) => ReactNode;
}

export const RunRow: FC<RowProps> = ({ row, renderSubRow }) => {
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
				{row.getVisibleCells().map((cell, idx, arr) => {
					const isBorderGroup = getIsBorderGroup({
						currId: cell.column.id,
						nextId: arr[idx + 1]?.column?.id,
						groups: COLUMN_GROUPS
					});

					return (
						<td
							key={cell.id}
							className={cn(
								'px-4 py-0 bg-white',
								isBorderGroup && 'border-r',
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
					<td colSpan={11}>{renderSubRow(row)}</td>
				</tr>
			) : null}
		</Fragment>
	);
};
