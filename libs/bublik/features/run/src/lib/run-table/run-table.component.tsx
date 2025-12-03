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
import { bublikAPI, getErrorMessage } from '@/services/bublik-api';
import {
	ButtonTw,
	cn,
	DataTableFacetedFilter,
	Icon,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';

import { globalFilterFn } from './filter';
import { getRowCanExpand } from './utils';
import { RunHeader, RunRow, RunTableInstructionDialog } from './components';
import { useExpandUnexpected } from './hooks';
import { Toolbar } from './toolbar';
import { getColumns } from './columns';
import { useGlobalRequirements } from '../hooks';
import {
	getRowId,
	migrateExpandedStateUrl,
	shouldMigrateExpandedState
} from './run-table.hooks';

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
					<p className="text-lg">No data found</p>
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
	projectId?: number;
	targetIterationId?: number;
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
		runId,
		projectId,
		targetIterationId
	} = props;

	const columns = useMemo(
		() =>
			getColumns({
				projectId,
				runIds: typeof runId === 'string' ? [Number(runId)] : runId.map(Number)
			}),
		[projectId, runId]
	);

	const table = useReactTable<RunData | MergedRun>({
		data,
		columns,
		state: { expanded, globalFilter, sorting, columnVisibility },
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => row.children,
		onExpandedChange: onExpandedChange,
		autoResetExpanded: false,
		getRowCanExpand: getRowCanExpand,
		getFilteredRowModel: getFilteredRowModel(),
		onGlobalFilterChange: onGlobalFilterChange,
		onColumnVisibilityChange: onColumnVisibilityChange,
		globalFilterFn: globalFilterFn,
		filterFromLeafRows: true,
		getSortedRowModel: getSortedRowModel(),
		getRowId: shouldMigrateExpandedState(expanded) ? undefined : getRowId,
		onSortingChange: onSortingChange,
		autoResetAll: false
	});

	const { showUnexpected, expandUnexpected, expandToIteration } =
		useExpandUnexpected({ table });

	useMount(() => {
		if (openUnexpected) showUnexpected();
		if (openUnexpectedResults) expandUnexpected();
		if (targetIterationId) expandToIteration(targetIterationId);

		if (shouldMigrateExpandedState(expanded)) {
			migrateExpandedStateUrl(expanded, table.getCoreRowModel().rowsById);
		}
	});

	return (
		<div className={cn('rounded isolate')} data-testid="run-table">
			<div className="flex items-center justify-between px-4 py-1 bg-white sticky top-0 z-20 border-b border-border-primary">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							Toolbar
						</span>
						<RunTableInstructionDialog />
					</div>
					<GlobalRequirementsFilter runId={runId} />
				</div>
				<Toolbar table={table} />
			</div>
			{data.length === 0 ? (
				<div className="flex items-center justify-center h-full">
					<RunTableEmpty />
				</div>
			) : (
				<table
					className={cn(
						'w-full p-0 m-0 border-separate h-full border-spacing-0',
						isFetching && 'opacity-40 pointer-events-none'
					)}
				>
					<RunHeader instance={table} />
					<tbody className="text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary">
						{table.getRowModel().rows.map((row) => (
							<RunRow
								key={row.id}
								row={row}
								runId={runId}
								targetIterationId={targetIterationId}
							/>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

function GlobalRequirementsFilter({ runId }: { runId: string | string[] }) {
	const {
		globalRequirements,
		setGlobalRequirements,
		resetGlobalRequirements,
		localRequirements,
		setLocalRequirements
	} = useGlobalRequirements();

	const { data: availableRequirements } = bublikAPI.useGetRunRequirementsQuery(
		Array.isArray(runId) ? runId : [runId]
	);

	const options =
		availableRequirements?.map((requirement) => ({
			label: requirement,
			value: requirement
		})) ?? [];

	function handleChange(values: string[] | undefined) {
		setLocalRequirements(values ?? []);
	}

	function handleSubmit() {
		setGlobalRequirements(localRequirements);
	}

	function handleReset() {
		resetGlobalRequirements();
		setLocalRequirements([]);
	}

	const hasChanges = useMemo(() => {
		if (localRequirements.length !== globalRequirements.length) return true;

		return (
			localRequirements.some((req) => !globalRequirements.includes(req)) ||
			globalRequirements.some((req) => !localRequirements.includes(req))
		);
	}, [globalRequirements, localRequirements]);

	return (
		<>
			<DataTableFacetedFilter
				title="Requirements"
				size="xss"
				disabled={availableRequirements?.length === 0}
				options={options}
				onChange={handleChange}
				value={localRequirements}
			/>
			<Tooltip content="Apply requirements filter globally to the run">
				<ButtonTw
					variant={hasChanges ? 'primary' : 'secondary'}
					size="xss"
					onClick={handleSubmit}
				>
					<Icon name="Refresh" size={18} className="mr-1.5" />
					<span>Submit</span>
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Reset global requirements filter">
				<ButtonTw variant="secondary" size="xss" onClick={handleReset}>
					<Icon name="Bin" size={18} className="mr-1.5" />
					<span>Reset</span>
				</ButtonTw>
			</Tooltip>
		</>
	);
}
