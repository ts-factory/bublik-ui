/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useCopyToClipboard } from '@/shared/hooks';
import { cn, toast } from '@/shared/tailwind-ui';
import { indentEnv } from '@/shared/utils';

import { LogHeaderBlock } from '@/shared/types';

export interface ParametersTableProps {
	parameters: Required<LogHeaderBlock['meta']>['parameters'];
}

export const ParametersTable = (props: ParametersTableProps) => {
	const { parameters } = props;

	const envIsLargerThan30Chars = parameters.some(
		({ name, value }) => name === 'env' && value.length >= 30
	);

	const data = useMemo(
		() =>
			envIsLargerThan30Chars
				? parameters.filter(({ name }) => name !== 'env')
				: parameters,
		[envIsLargerThan30Chars, parameters]
	);

	const columns = useMemo<
		ColumnDef<ParametersTableProps['parameters'][number]>[]
	>(
		() => [
			{
				header: 'Name',
				accessorKey: 'name',
				meta: { className: 'font-semibold' }
			},
			{ header: 'Value', accessorKey: 'value' }
		],
		[]
	);

	const envValue = parameters.find(({ name }) => name === 'env');

	const table = useReactTable<ParametersTableProps['parameters'][number]>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	const [, copy] = useCopyToClipboard({
		onSuccess: (text) => toast.success(`Copied ${text} to clipboard`)
	});

	return (
		<div>
			{data.length ? (
				<table className="h-auto p-0 m-0 border border-separate rounded-lg border-spacing-0 min-w-[300px]">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="h-8.5 [&>*:not(:last-child)]:border-r"
							>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										colSpan={header.colSpan}
										className={cn(
											'px-2 py-1 border-b border-border-primary whitespace-nowrap',
											'text-sm text-left'
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className={`hover:bg-gray-50 [&>*:not(:last-child)]:border-r [&:not(:last-child)>*]:border-b [&:not(:last-child)>*]:border-border-primary cursor-pointer`}
								onClick={() =>
									copy(`${row.getValue('name')}=${row.getValue('value')}`)
								}
							>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className={cn(
											'text-sm',
											'px-2 py-1',
											cell.column.columnDef.meta?.className
										)}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			) : null}
			{envValue && envIsLargerThan30Chars ? (
				<div className="mt-2 border border-transparent rounded bg-primary-wash rdx-state-open:border-primary">
					<pre className="p-4 text-xs">{indentEnv(envValue.value)}</pre>
				</div>
			) : null}
		</div>
	);
};
