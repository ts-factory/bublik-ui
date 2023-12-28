/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useRef } from 'react';

import { flexRender, Table } from '@tanstack/react-table';
import { RunData } from '@/shared/types';
import { TableSort, cn } from '@/shared/tailwind-ui';

import { getIsBorderGroup } from '../../utils';
import { COLUMN_GROUPS } from '../../constants';

export interface RunHeaderProps {
	instance: Table<RunData>;
}

export const RunHeader: FC<RunHeaderProps> = ({ instance }) => {
	const ref = useRef<HTMLTableSectionElement>(null);

	return (
		<thead
			ref={ref}
			className={cn(
				'text-left text-[0.6875rem] font-semibold leading-[0.875rem]'
			)}
		>
			{instance.getHeaderGroups().map((headerGroup) => (
				<tr key={headerGroup.id} className="h-8.5">
					{headerGroup.headers.map((header, idx, arr) => {
						const isBorderGroup = getIsBorderGroup({
							currId: header.column.id,
							nextId: arr[idx + 1]?.column?.id,
							groups: COLUMN_GROUPS
						});

						return (
							<th
								key={header.id}
								colSpan={header.colSpan}
								className={cn(
									'px-2 border-b sticky top-0 z-20 bg-white uppercase',
									isBorderGroup && 'border-r border-border-primary'
								)}
							>
								{header.isPlaceholder ? null : (
									<div
										{...(header.column.getCanSort()
											? {
													onClick: header.column.getToggleSortingHandler(),
													className: cn(
														'flex gap-1 items-center cursor-pointer select-none hover:bg-primary-wash transition-colors rounded px-2 py-1',
														header.column.getIsSorted() && 'bg-primary-wash'
													)
											  }
											: {})}
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
										{header.column.getCanSort() && (
											<TableSort
												sortDescription={header.column.getIsSorted()}
											/>
										)}
									</div>
								)}
							</th>
						);
					})}
				</tr>
			))}
		</thead>
	);
};
