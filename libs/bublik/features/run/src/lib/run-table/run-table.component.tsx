/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useRef, useState, useEffect } from 'react';
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
import {
	DndContext,
	DragEndEvent,
	DragMoveEvent,
	DragStartEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { MergedRun, RunData, RunStatsColumn } from '@/shared/types';
import { useMount } from '@/shared/hooks';
import { bublikAPI } from '@/services/bublik-api';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import {
	ButtonTw,
	cn,
	DataTableFacetedFilter,
	Icon,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { globalFilterFn } from './filter';
import { getRowCanExpand } from './utils';
import { RunHeader, RunRow, RunTableInstructionDialog } from './components';
import { useExpandUnexpected } from './hooks';
import { Toolbar } from './toolbar';
import { getColumns } from './columns';
import { buildColumnGroups } from './constants';
import { ColumnId } from './types';
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
	return <BublikErrorState error={error} iconSize={48} />;
};

export const RunTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No data found"
			description="No run data is available"
			iconSize={48}
		/>
	);
};

export interface RunTableProps {
	data: RunData[] | MergedRun[];
	openUnexpected?: boolean;
	openUnexpectedIntentId?: string;
	expanded: ExpandedState;
	sorting: SortingState;
	globalFilter: string[];
	columnVisibility: VisibilityState;
	defaultColumnVisibility: VisibilityState;
	defaultColumns?: RunStatsColumn[];
	columnOrder: ColumnId[];
	defaultColumnOrder: ColumnId[];
	onColumnOrderChange: (order: ColumnId[]) => void;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
	onExpandedChange: OnChangeFn<ExpandedState>;
	onSortingChange: OnChangeFn<SortingState>;
	onGlobalFilterChange: OnChangeFn<string[]>;
	openUnexpectedResults?: boolean;
	isFetching?: boolean;
	runId: string | string[];
	projectId?: number;
	targetIterationId?: number;
	resultColumnId?: string;
}

export const RunTable = (props: RunTableProps) => {
	const {
		data,
		openUnexpected,
		openUnexpectedIntentId,
		openUnexpectedResults,
		expanded,
		globalFilter,
		sorting,
		onExpandedChange,
		onGlobalFilterChange,
		onSortingChange,
		columnVisibility,
		defaultColumnVisibility,
		defaultColumns,
		columnOrder,
		defaultColumnOrder,
		onColumnOrderChange,
		onColumnVisibilityChange,
		isFetching,
		runId,
		projectId,
		targetIterationId,
		resultColumnId
	} = props;

	const columns = useMemo(
		() =>
			getColumns({
				projectId,
				runIds: typeof runId === 'string' ? [Number(runId)] : runId.map(Number),
				defaultColumns,
				columnOrder
			}),
		[columnOrder, defaultColumns, projectId, runId]
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

	const sortableColumnIds = useMemo<ColumnId[]>(
		() => columnOrder.filter((id) => id !== ColumnId.Tree),
		[columnOrder]
	);

	const tableRef = useRef<HTMLTableElement>(null);
	// Columns of the group being dragged. Their cells slide together via the
	// `--rt-group-dx` CSS variable, which is updated on drag move (no re-render).
	const [draggingGroupColumns, setDraggingGroupColumns] = useState<
		ColumnId[] | null
	>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	);

	function handleDragStart(event: DragStartEvent) {
		if (event.active.data.current?.type !== 'group') return;

		const group = buildColumnGroups(sortableColumnIds).find(
			(group) => group.id === event.active.id
		);

		setDraggingGroupColumns(group?.columnIds ?? null);
		tableRef.current?.style.setProperty('--rt-group-dx', '0px');
	}

	function handleDragMove(event: DragMoveEvent) {
		if (event.active.data.current?.type !== 'group') return;

		tableRef.current?.style.setProperty('--rt-group-dx', `${event.delta.x}px`);
	}

	function resetGroupDrag() {
		setDraggingGroupColumns(null);
		tableRef.current?.style.removeProperty('--rt-group-dx');
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		resetGroupDrag();

		if (!over || active.id === over.id) return;

		if (active.data.current?.type === 'group') {
			const groups = buildColumnGroups(sortableColumnIds);

			const oldIndex = groups.findIndex((group) => group.id === active.id);
			// `over` can be another group header or any column under it.
			let newIndex = groups.findIndex((group) => group.id === over.id);
			if (newIndex === -1) {
				newIndex = groups.findIndex((group) =>
					group.columnIds.includes(over.id as ColumnId)
				);
			}

			if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

			const reordered = arrayMove(groups, oldIndex, newIndex).flatMap(
				(group) => group.columnIds
			);

			trackEvent(analyticsEventNames.runTableToolbarColumnReorder, {
				columnId: String(active.id),
				fromIndex: oldIndex,
				toIndex: newIndex,
				source: 'table_group_header'
			});

			onColumnOrderChange([ColumnId.Tree, ...reordered]);
			return;
		}

		const oldIndex = sortableColumnIds.indexOf(active.id as ColumnId);
		const newIndex = sortableColumnIds.indexOf(over.id as ColumnId);

		if (oldIndex === -1 || newIndex === -1) return;

		trackEvent(analyticsEventNames.runTableToolbarColumnReorder, {
			columnId: String(active.id),
			fromIndex: oldIndex,
			toIndex: newIndex,
			source: 'table_header'
		});

		onColumnOrderChange([
			ColumnId.Tree,
			...arrayMove(sortableColumnIds, oldIndex, newIndex)
		]);
	}

	const currentIntentToken = useMemo(() => {
		if (openUnexpectedIntentId) {
			return openUnexpectedIntentId;
		}

		if (targetIterationId !== undefined) {
			return `target-iteration:${targetIterationId}`;
		}

		if (openUnexpectedResults) {
			return 'legacy-open-unexpected-results';
		}

		if (openUnexpected) {
			return 'legacy-open-unexpected';
		}

		return undefined;
	}, [
		openUnexpected,
		openUnexpectedIntentId,
		openUnexpectedResults,
		targetIterationId
	]);

	const navigationIntentRef = useRef({
		token: currentIntentToken,
		openUnexpected: Boolean(openUnexpected),
		openUnexpectedResults: Boolean(openUnexpectedResults),
		targetIterationId
	});
	const appliedIntentTokenRef = useRef<string | null>(null);

	if (
		currentIntentToken &&
		navigationIntentRef.current.token !== currentIntentToken
	) {
		navigationIntentRef.current = {
			token: currentIntentToken,
			openUnexpected: Boolean(openUnexpected),
			openUnexpectedResults: Boolean(openUnexpectedResults),
			targetIterationId
		};
	}

	if (!navigationIntentRef.current.token && currentIntentToken) {
		navigationIntentRef.current.token = currentIntentToken;
	}

	if (openUnexpected) {
		navigationIntentRef.current.openUnexpected = true;
	}

	if (openUnexpectedResults) {
		navigationIntentRef.current.openUnexpectedResults = true;
	}

	if (targetIterationId !== undefined) {
		navigationIntentRef.current.targetIterationId = targetIterationId;
	}

	useEffect(() => {
		if (!navigationIntentRef.current.token) {
			return;
		}

		if (appliedIntentTokenRef.current === navigationIntentRef.current.token) {
			return;
		}

		if (data.length === 0) {
			return;
		}

		const {
			openUnexpected: shouldOpenUnexpected,
			openUnexpectedResults: shouldOpenUnexpectedResults,
			targetIterationId: targetIterationIdToExpand
		} = navigationIntentRef.current;

		if (
			!shouldOpenUnexpected &&
			!shouldOpenUnexpectedResults &&
			targetIterationIdToExpand === undefined
		) {
			return;
		}

		if (shouldOpenUnexpected) {
			showUnexpected();
		}

		if (shouldOpenUnexpectedResults) {
			expandUnexpected();
		}

		if (targetIterationIdToExpand !== undefined) {
			expandToIteration(targetIterationIdToExpand, resultColumnId);
		}

		appliedIntentTokenRef.current = navigationIntentRef.current.token;
	}, [
		data.length,
		expandToIteration,
		expandUnexpected,
		openUnexpected,
		openUnexpectedIntentId,
		openUnexpectedResults,
		resultColumnId,
		showUnexpected,
		targetIterationId
	]);

	useMount(() => {
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
				<Toolbar
					table={table}
					defaultColumnVisibility={defaultColumnVisibility}
					columnOrder={columnOrder}
					defaultColumnOrder={defaultColumnOrder}
					onColumnOrderChange={onColumnOrderChange}
				/>
			</div>
			{data.length === 0 ? (
				<div className="flex items-center justify-center h-full">
					<RunTableEmpty />
				</div>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragMove={handleDragMove}
					onDragEnd={handleDragEnd}
					onDragCancel={resetGroupDrag}
				>
					<table
						ref={tableRef}
						className={cn(
							'w-full p-0 m-0 border-separate h-full border-spacing-0',
							isFetching && 'opacity-40 pointer-events-none'
						)}
					>
						<RunHeader
							instance={table}
							columnOrder={columnOrder}
							draggingGroupColumns={draggingGroupColumns}
						/>
						<tbody className="text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary">
							{table.getRowModel().rows.map((row) => (
								<RunRow
									key={row.id}
									row={row}
									runId={runId}
									sortableColumnIds={sortableColumnIds}
									draggingGroupColumns={draggingGroupColumns}
									targetIterationId={targetIterationId}
								/>
							))}
						</tbody>
					</table>
				</DndContext>
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
		const nextValues = values ?? [];

		trackEvent(analyticsEventNames.runTableRequirementsChange, {
			selectedCount: nextValues.length
		});

		setLocalRequirements(nextValues);
	}

	function handleSubmit() {
		trackEvent(analyticsEventNames.runTableRequirementsSubmit, {
			selectedCount: localRequirements.length,
			hasChanges
		});

		setGlobalRequirements(localRequirements);
	}

	function handleReset() {
		trackEvent(analyticsEventNames.runTableRequirementsReset, {
			selectedCount: 0
		});

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
