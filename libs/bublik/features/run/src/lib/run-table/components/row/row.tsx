/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment } from 'react';
import { flexRender, Row } from '@tanstack/react-table';

import { cn } from '@/shared/tailwind-ui';
import { MergedRun, NodeEntity, RunData } from '@/shared/types';

import { ResultTableContainer } from '../../../result-table';
import { useMeasure } from 'react-use';

export interface RowProps {
	row: Row<RunData | MergedRun>;
	runId: string | string[];
	targetIterationId?: number;
}

export const RunRow = ({ row, runId, targetIterationId }: RowProps) => {
	const isExpanded = row.getIsExpanded();
	const isTest = row.original?.type === NodeEntity.Test;
	const isExpandedTest = isTest && isExpanded;
	const [ref, { height }] = useMeasure<HTMLTableRowElement>();

	return (
		<Fragment>
			<tr
				className={cn(
					'[&>*]:hover:bg-gray-50 h-full relative z-10',
					isExpandedTest &&
						'[&>*]:bg-gray-50 h-full [&>*]:sticky [&>*]:top-[102px]'
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
								'px-2 py-0 bg-white',
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
					<td colSpan={row.getVisibleCells().length} className="p-0 bg-white">
						<div style={{ paddingLeft: `${row.depth * 0.8}rem` }}>
							<ResultTableContainer
								runId={runId}
								row={row}
								height={height}
								targetIterationId={targetIterationId}
							/>
						</div>
					</td>
				</tr>
			) : null}
		</Fragment>
	);
};
