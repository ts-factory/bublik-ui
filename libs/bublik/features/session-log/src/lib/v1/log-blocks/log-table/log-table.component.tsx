/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Row,
	RowData,
	Table,
	useReactTable
} from '@tanstack/react-table';

import { LogTableBlock, LogTableData } from '@/shared/types';
import { ButtonTw, cn, Pagination } from '@/shared/tailwind-ui';

import {
	DeltaContextProvider,
	useDelta,
	useLogTableContext,
	useLogTablePaginationContext
} from './log-table.context';
import {
	useLogTableExpandedState,
	useLogTableGlobalFilter,
	useLogTablePagination,
	useLogTablePaginationProps,
	useLogTableTimestamp
} from './log-table.hooks';
import { getRowColor, getRowIdCreator, logFilterFn } from './log-table.utils';
import { LogTableToolbar } from './toolbar';
import { SettingsContextProvider } from './settings.context';
import { getColumns } from './log-table.columns';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className?: string;
	}
}

export const BlockLogTable = (props: LogTableBlock & { id: string }) => {
	const { id, data } = props;

	// 1. State
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const { setExpanded, expanded } = useLogTableExpandedState({ id, data });
	const { filters, globalFilter, setGlobalFilter } = useLogTableGlobalFilter({
		data
	});

	const { isTimestampDeltaShown, toggleIsTimestampDeltaShown } =
		useLogTableTimestamp();

	const context = useLogTableContext();

	const columns = useMemo(
		() => getColumns({ showTimestampDelta: isTimestampDeltaShown }),
		[isTimestampDeltaShown]
	);

	const paginationContext = useLogTablePaginationContext();
	const { pagination, totalCount } = useLogTablePagination({
		context: paginationContext
	});

	const table = useReactTable<LogTableData>({
		pageCount: totalCount,
		data: useMemo(() => data, [data]),
		columns,
		state: { globalFilter, expanded, pagination, columnFilters },
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSubRows: (row) => row.children,
		getRowCanExpand: (row) => Boolean(row.subRows.length),
		getRowId: getRowIdCreator(id),
		onExpandedChange: setExpanded,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: logFilterFn,
		filterFromLeafRows: true,
		debugTable: true,
		manualPagination: true,
		meta: { id }
	});

	useLayoutEffect(() => {
		context?.onLogTableMount?.(id, table);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useLayoutEffect(() => {
		context?.onLogTableUnmount?.(id, table);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const deltaApi = useDelta({ table });
	const { paginationProps } = useLogTablePaginationProps({
		id,
		context,
		table
	});

	const startRef = useRef<HTMLDivElement>(null);

	const toolbarProps: ComponentProps<typeof LogTableToolbar> = {
		table,
		levels: filters.levels,
		mainEntityFilters: filters.mainEntityFilters,
		entityFilters: filters.entitiesFilters,
		scenario: filters.scenarioOptions,
		test: filters.testOptions,
		handleDeltaChangeClick: toggleIsTimestampDeltaShown,
		isDeltaShown: isTimestampDeltaShown,
		startRef
	};

	return (
		<DeltaContextProvider value={deltaApi}>
			<SettingsContextProvider>
				<div
					data-block-type={props.type}
					className="flex flex-col items-center"
				>
					<h2 className="w-full text-lg font-semibold text-text-primary mb-2">
						Logs
					</h2>
					<LogTableToolbar {...toolbarProps} />
					{pagination && totalCount ? (
						<LogPagination
							id={id}
							pageIndex={paginationContext?.pagination?.state.pageIndex}
							onPageClick={context?.onPageClick}
							{...paginationProps}
						/>
					) : null}
					<div ref={startRef} />
					<div className="relative self-stretch">
						<table className="w-full border border-border-primary border-separate border-spacing-0 rounded-md h-fit p-0 m-0 font-mono text-left text-[0.875rem] text-text-primary">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr
										key={headerGroup.id}
										className="[&>*:not(:last-child)]:border-r [&>*:first-child]:rounded-tl-md [&>*:last-child]:rounded-tr-md"
									>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												colSpan={header.colSpan}
												className={cn(
													'px-1.5 py-2 border-b font-semibold border-border-primary bg-gray-50',
													header.column.columnDef.meta?.className
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
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={table.getAllColumns().length}
											className="text-center py-4 text-gray-500"
										>
											No results found for the current filters
										</td>
									</tr>
								) : (
									table
										.getRowModel()
										.rows.map((row, index, array) => (
											<LogRow
												key={row.id}
												row={row}
												table={table}
												isLast={index === array.length - 1}
											/>
										))
								)}
							</tbody>
						</table>
					</div>
					{pagination && totalCount ? (
						<LogPagination
							id={id}
							pageIndex={paginationContext?.pagination?.state.pageIndex}
							onPageClick={context?.onPageClick}
							{...paginationProps}
						/>
					) : null}
				</div>
			</SettingsContextProvider>
		</DeltaContextProvider>
	);
};

export interface LogRowProps {
	row: Row<LogTableData>;
	table: Table<LogTableData>;
	isLast: boolean;
}

export function LogRow({ row, table, isLast }: LogRowProps) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const bgClass = getRowColor(row.original);
	const canExpand = row.getCanExpand();
	const nextRowCanExpand = table
		.getRowModel()
		.rows[
			table.getRowModel().rows.findIndex((r) => r.id === row.id) + 1
		]?.getCanExpand();
	const shouldAddBorder = canExpand || nextRowCanExpand;

	return (
		<tr
			id={row.id}
			data-depth={row.depth}
			className={cn(
				'border-border-primary [&>*:not(:last-child)]:border-r',
				shouldAddBorder && !isLast
					? '[&>*]:border-b'
					: !isLast
					? '[&>*]:border-b'
					: '',
				'[&:last-child>:first-child]:rounded-bl-md [&:last-child>:last-child]:rounded-br-md',
				bgClass
			)}
		>
			{row.getVisibleCells().map((cell) => (
				<td
					key={cell.id}
					className={cn(
						'px-1.5 py-0.5 align-top',
						cell.column.columnDef.meta?.className
					)}
				>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</td>
			))}
		</tr>
	);
}

interface LogPaginationProps extends ComponentProps<typeof Pagination> {
	id: string;
	pageIndex?: number;
	onPageClick?: (id: string, page: number) => void;
}

function LogPagination(props: LogPaginationProps) {
	const { pageIndex, id, onPageClick, ...restProps } = props;

	return (
		<div className="flex justify-center gap-4 my-4">
			<Pagination {...restProps} />
			<ButtonTw
				size="md"
				variant="outline"
				state={pageIndex === -1 ? 'active' : 'default'}
				onClick={() => onPageClick?.(id, 0)}
			>
				All pages
			</ButtonTw>
		</div>
	);
}
