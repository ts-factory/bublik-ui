/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	ComponentPropsWithoutRef,
	useEffect,
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
	useReactTable
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';

import { LogTableBlock, LogTableData } from '@/shared/types';
import { useMeasure } from '@/shared/hooks';
import { ButtonTw, cn, Icon, Pagination } from '@/shared/tailwind-ui';

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
	const [isIntersection, setIsIntersected] = useState(false);

	useEffect(() => {
		const ref = startRef.current;

		if (!ref) return;

		const observer = new IntersectionObserver(
			(entry) => setIsIntersected(!entry[0].isIntersecting),
			{ rootMargin: '0px', threshold: 1 }
		);

		observer.observe(ref);
		return () => observer.disconnect();
	}, []);

	const toolbarProps: ComponentProps<typeof LogTableToolbar> = {
		table,
		levels: filters.levels,
		mainEntityFilters: filters.mainEntityFilters,
		entityFilters: filters.entitiesFilters,
		scenario: filters.scenarioOptions,
		test: filters.testOptions,
		handleDeltaChangeClick: toggleIsTimestampDeltaShown,
		isDeltaShown: isTimestampDeltaShown
	};

	return (
		<DeltaContextProvider value={deltaApi}>
			<SettingsContextProvider>
				<div data-block-type={props.type}>
					<LogTableToolbar {...toolbarProps} />
					{pagination && totalCount ? (
						<LogPagination
							id={id}
							pageIndex={paginationContext?.pagination?.state.pageIndex}
							onPageClick={context?.onPageClick}
							{...paginationProps}
						/>
					) : null}

					<ToolbarFloating
						isVisible={isIntersection}
						toolbarProps={toolbarProps}
					/>
					<div ref={startRef} />
					<div className="relative">
						<table className="w-full border border-border-primary border-separate border-spacing-0 rounded-lg h-auto p-0 m-0 font-mono text-left text-[0.875rem] text-text-primary">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr
										key={headerGroup.id}
										className="[&>*:not(:last-child)]:border-r"
									>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												colSpan={header.colSpan}
												className={cn(
													'px-1.5 py-0.5 border-b border-border-primary',
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
								{table.getRowModel().rows.map((row) => (
									<LogRow key={row.id} row={row} />
								))}
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
}

export const LogRow = (props: LogRowProps) => {
	const { row } = props;

	const bgClass = getRowColor(row.original);

	return (
		<tr
			id={row.id}
			data-depth={row.depth}
			className={cn(
				'border-border-primary [&>*:not(:last-child)]:border-r [&:not(:last-child)>*]:border-b [&:not(:last-child)]:border-b',
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
};

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

interface ToolbarFloatingProps {
	isVisible?: boolean;
	toolbarProps: ComponentProps<typeof LogTableToolbar>;
}

export const ToolbarFloating = (props: ToolbarFloatingProps) => {
	const PADDING = 8;

	const { isVisible, toolbarProps } = props;
	const [ref, { height }] = useMeasure<HTMLDivElement>();
	const [isOpen, setIsOpen] = useState(false);

	const translation = !isOpen ? height + PADDING * 2 : 0;

	return (
		<AnimatePresence>
			{isVisible ? (
				<motion.div
					initial={{ opacity: 0, y: -translation }}
					animate={{ opacity: 1, y: -translation }}
					transition={{ type: 'spring', bounce: 0.1 }}
					className="sticky top-0 z-50 flex flex-col items-center justify-center left-1/2"
				>
					<div
						className={cn(
							'relative bg-white rounded-b-lg transition-shadow',
							isOpen && 'shadow-xl'
						)}
					>
						<div ref={ref} className="p-2">
							<LogTableToolbar {...toolbarProps} />
						</div>
					</div>
					<div className="z-10 flex justify-center">
						<FloatingExpandButton
							isOpen={isOpen}
							onClick={() => setIsOpen(!isOpen)}
							aria-label="Show or hide toolbar toolbar"
						/>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};

type FloatingExpandButtonProps = ComponentPropsWithoutRef<'button'> & {
	isOpen: boolean;
};

export const FloatingExpandButton = ({
	isOpen,
	className,
	...props
}: FloatingExpandButtonProps) => {
	return (
		<div
			className={cn(
				'rounded-b-xl flex shadow-xl items-center justify-center transition-all min-w-[250px] border-t',
				isOpen
					? 'bg-white text-primary hover:bg-primary-wash border-t-border-primary'
					: 'bg-primary text-white border-t-transparent'
			)}
		>
			<button
				{...props}
				className={cn(
					'flex items-center justify-center flex-1 p-0.5 rounded-md',
					className
				)}
			>
				<Icon
					name="ArrowShortTop"
					size={20}
					className={cn('transition-all', isOpen ? 'rotate-0' : 'rotate-180')}
				/>
			</button>
		</div>
	);
};
