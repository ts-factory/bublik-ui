/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';

import { flexRender, Table } from '@tanstack/react-table';
import { MergedRun, RunData } from '@/shared/types';
import { TableSort, cn } from '@/shared/tailwind-ui';

export interface RunHeaderProps {
	instance: Table<RunData | MergedRun>;
}

export const RunHeader = ({ instance }: RunHeaderProps) => {
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
					{headerGroup.headers.map((header, idx, arr) => (
						<th
							key={header.id}
							colSpan={header.colSpan}
							className={cn(
								'px-2 border-b bg-white',
								arr.length - 1 !== idx && 'border-r border-border-primary',
								header.column.columnDef.meta?.className
							)}
							style={{
								position: 'sticky',
								top: header.depth === 1 ? 0 : header.depth * 17,
								zIndex: 20
							}}
						>
							{header.isPlaceholder ? null : header.column.getCanSort() ? (
								<div
									{...(header.column.getCanSort()
										? {
												onClick: header.column.getToggleSortingHandler(),
												className: cn(
													'flex gap-1 items-center cursor-pointer select-none hover:bg-primary-wash transition-colors rounded px-1 py-1',
													header.column.getIsSorted() && 'bg-primary-wash'
												)
										  }
										: {})}
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext()
									)}
									<TableSort sortDescription={header.column.getIsSorted()} />
								</div>
							) : (
								flexRender(header.column.columnDef.header, header.getContext())
							)}
						</th>
					))}
				</tr>
			))}
		</thead>
	);
};
