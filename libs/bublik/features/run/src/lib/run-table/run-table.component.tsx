/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import {
	getExpandedRowModel,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	useReactTable,
	SortingState,
	ExpandedState,
	OnChangeFn,
	VisibilityState
} from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';
import { useMount } from '@/shared/hooks';
import { getErrorMessage } from '@/services/bublik-api';
import { cn, Icon, Skeleton, Tooltip } from '@/shared/tailwind-ui';

import { globalFilterFn } from './filter';
import {
	getRowCanExpand,
	getRowsValuesById,
	getRowsDescriptionById
} from './utils';
import { AllRowsContext, RowValuesContextProvider } from './context';
import { RunHeader, RunRow } from './components';
import { useExpandUnexpected } from './hooks';
import { Toolbar } from './toolbar';
import { getColumns } from './columns';

export const RunTableLoading = () => {
	return <Skeleton className="rounded h-[30vh] w-full" />;
};

export interface RunTableErrorProps {
	error: unknown;
}

export const RunTableError = ({ error = {} }: RunTableErrorProps) => {
	const { description, status, title } = getErrorMessage(error);

	return (
		<div className="mx-auto mt-72">
			<div className="flex items-center gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="text-text-unexpected"
				/>
				<div className="">
					<h1 className="text-2xl font-semibold">
						{status} {title}
					</h1>
					<p>{description}</p>
				</div>
			</div>
		</div>
	);
};

export const RunTableEmpty = () => {
	return (
		<div className="mx-auto mt-80">
			<div className="flex items-center gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="self-start text-primary"
				/>
				<div>
					<h1 className="text-2xl font-bold mb-0.5">No data found</h1>
					<p className="text-lg">No data found for this run</p>
				</div>
			</div>
		</div>
	);
};

export interface RunTableProps {
	data: RunData[] | MergedRun[];
	openUnexpected?: boolean;
	expanded: ExpandedState;
	sorting: SortingState;
	globalFilter: string[];
	columnVisibility: VisibilityState;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
	onExpandedChange: OnChangeFn<ExpandedState>;
	onSortingChange: OnChangeFn<SortingState>;
	onGlobalFilterChange: OnChangeFn<string[]>;
	openUnexpectedResults?: boolean;
	isFetching?: boolean;
	runId: string | string[];
}

export const RunTable = (props: RunTableProps) => {
	const {
		data,
		openUnexpected,
		openUnexpectedResults,
		expanded,
		globalFilter,
		sorting,
		onExpandedChange,
		onGlobalFilterChange,
		onSortingChange,
		columnVisibility,
		onColumnVisibilityChange,
		isFetching,
		runId
	} = props;

	const columns = useMemo(() => getColumns(), []);

	const table = useReactTable<RunData | MergedRun>({
		data,
		columns,
		state: { expanded, globalFilter, sorting, columnVisibility },
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => row.children,
		onExpandedChange,
		autoResetExpanded: false,
		getRowCanExpand,
		getFilteredRowModel: getFilteredRowModel(),
		onGlobalFilterChange,
		onColumnVisibilityChange,
		globalFilterFn: globalFilterFn,
		filterFromLeafRows: true,
		getSortedRowModel: getSortedRowModel(),
		onSortingChange
	});

	const context = useMemo<AllRowsContext>(() => {
		const rowsById = table.getPreFilteredRowModel().rowsById;
		const flatRows = table.getPreFilteredRowModel().flatRows;
		const rowsValues = getRowsValuesById(rowsById);
		const rowsIds = getRowsDescriptionById(flatRows);

		return { rowsValues, rowsIds };
	}, [table]);

	const { showUnexpected, expandUnexpected } = useExpandUnexpected({
		table,
		rowsIds: context.rowsIds,
		rowsValues: context.rowsValues
	});

	useMount(() => {
		if (openUnexpected) showUnexpected();
		if (openUnexpectedResults) expandUnexpected();
	});

	return (
		<RowValuesContextProvider value={context}>
			<div className="flex items-center justify-between px-4 py-1 bg-white rounded">
				<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
					Toolbar
				</span>
				<Tooltip content="You can `ctrl+click` to open filtered results in subtree">
					<div className="mr-auto ml-2 text-primary">
						<Icon name="InformationCircleQuestionMark" size={16} />
					</div>
				</Tooltip>
				<Toolbar table={table} />
			</div>
			<div
				className={cn('bg-white rounded', isFetching && 'opacity-40')}
				data-testid="run-table"
			>
				<table className="w-full p-0 m-0 border-separate h-full border-spacing-0">
					<RunHeader instance={table} />
					<tbody className="text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary">
						{table.getRowModel().rows.map((row) => (
							<RunRow key={row.id} row={row} runId={runId} />
						))}
					</tbody>
				</table>
			</div>
		</RowValuesContextProvider>
	);
};
