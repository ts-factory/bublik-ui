/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CSSProperties,
	Fragment,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	Row,
	Updater,
	useReactTable
} from '@tanstack/react-table';
import { createNextState } from '@reduxjs/toolkit';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';

import { useIsSticky, useMount } from '@/shared/hooks';
import { RunDataResults } from '@/shared/types';
import {
	cn,
	Skeleton,
	TwTableProps,
	ButtonTw,
	Icon,
	DataTableFacetedFilter,
	Tooltip
} from '@/shared/tailwind-ui';

import { getColumns } from './result-table.columns';
import {
	COLUMN_ID,
	ObtainedResultFilterSchema,
	StringArraySchema
} from './constants';
import { useTargetIterationId } from '../run-table/run-table.hooks';
import { RowState, useGlobalRequirements } from '../hooks';

const HEADER_HEIGHT = 102;
const STICKY_OFFSET = HEADER_HEIGHT + 1;

export interface SkeletonProps {
	rowCount?: number;
}

export const ResultTableLoading = ({ rowCount = 25 }: SkeletonProps) => {
	return (
		<div className="flex flex-col gap-1 mt-1 mb-1">
			<Skeleton className="rounded-b h-[38px]" />
			{Array(rowCount)
				.fill(1)
				.map((_, idx) => (
					<Skeleton key={idx} className="h-[110px] rounded" />
				))}
		</div>
	);
};

export const ResultTableError = () => <div>Error...</div>;

export const ResultTableEmpty = () => <div>Empty...</div>;

export interface ResultTableProps {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
	height: number;
	mode?: 'default' | 'diff' | 'dim';
	setMode: (mode: 'default' | 'diff' | 'dim') => void;
	showToolbar: boolean;
	setShowToolbar: (showToolbar: boolean) => void;
	targetIterationId?: number;
	rowState?: RowState;
	onRowClick?: (row: Row<RunDataResults>) => void;
	path?: string;
}

export const ResultTable = memo((props: ResultTableProps) => {
	const {
		data = [],
		rowId,
		showLinkToRun = false,
		height,
		mode = 'default',
		setMode,
		showToolbar,
		setShowToolbar,
		targetIterationId,
		rowState,
		onRowClick,
		path
	} = props;
	const {
		columnFilters,
		setColumnFilters,
		hasFilters: hasColumnFilters
	} = useColumnFilters(rowId);
	const {
		parameters,
		verdicts,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		artifactsFilter,
		onClearFilters,
		onFilterChange,
		onVerdictsFilterChange
	} = useDataTableFilters(rowId, data);
	const { hasGlobalRequirements } = useGlobalRequirementsFilters({
		localRequirements: requirementsFilter
	});
	const isDiffMode = mode === 'diff';
	const isDimMode = mode === 'dim';
	const hasFilters = hasColumnFilters || hasGlobalRequirements;
	const hasToolbar = showToolbar || hasFilters || isDiffMode || isDimMode;

	const columns = useMemo(
		() =>
			getColumns({
				rowId,
				showLinkToRun,
				data,
				mode,
				showToolbar: hasToolbar,
				setShowToolbar,
				path
			}),
		[rowId, showLinkToRun, data, mode, hasToolbar, setShowToolbar, path]
	);

	const { stickyOffset } = useStickyHeader({ height });

	const table = useReactTable<RunDataResults>({
		data,
		getRowId: (row) => String(row.result_id),
		columns,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableSorting: false,
		state: { columnFilters },
		onColumnFiltersChange: setColumnFilters
	});

	const gridTemplateColumns = columns
		.map((col) => col.meta?.['width'] || 'minmax(0, 1fr)')
		.join(' ');

	const headerRef = useRef<HTMLDivElement | null>(null);
	const { isSticky } = useIsSticky(headerRef, {
		offset: stickyOffset
	});

	const HEADER_ROW_HEIGHT = 42;
	const columnCount = columns.length;

	return (
		<div className="px-4 pb-2">
			<div className="w-full">
				<div className="grid relative z-[5]" style={{ gridTemplateColumns }}>
					{table.getHeaderGroups().map((headerGroup) => (
						<Fragment key={headerGroup.id}>
							{headerGroup.headers.map((header, idx, headers) => {
								const className = header.column.columnDef.meta?.['className'];
								const headerCellClassName =
									header.column.columnDef.meta?.['headerCellClassName'];

								return (
									<div
										key={header.id}
										className={cn(
											'px-1 py-2 text-left text-[0.6875rem] font-semibold leading-[0.875rem] z-20',
											'bg-primary-wash sticky',
											'flex items-center',
											idx === 0 && !hasToolbar && 'rounded-bl-md',
											idx === headers.length - 1 &&
												!hasToolbar &&
												'rounded-br-md',
											!hasToolbar && 'mb-1',
											className,
											headerCellClassName
										)}
										style={{
											top: height + HEADER_HEIGHT,
											boxShadow:
												isSticky && !hasToolbar
													? `rgba(0, 0, 0, 0.1) ${idx === 0 ? 0 : 7}px 2px 10px`
													: 'none'
										}}
										ref={(el) => {
											if (idx === 0) {
												headerRef.current = el;
											}
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</div>
								);
							})}
						</Fragment>
					))}

					{hasToolbar ? (
						<div
							className={cn(
								'flex items-center justify-between px-4 mb-1',
								'bg-white h-9 sticky shadow-sticky z-10 border-t border-border-primary'
							)}
							style={{
								gridColumn: `1 / ${columnCount + 1}`,
								top: `${height + HEADER_HEIGHT + HEADER_ROW_HEIGHT}px`
							}}
						>
							<div className="flex gap-2 items-center">
								<DataTableFacetedFilter
									title="Artifacts"
									size="xss"
									options={artifacts}
									value={artifactsFilter}
									onChange={(values) =>
										onFilterChange(COLUMN_ID.ARTIFACTS, values)
									}
									disabled={!artifacts.length || isDiffMode || isDimMode}
								/>
								<DataTableFacetedFilter
									title="Verdicts"
									size="xss"
									options={verdicts}
									value={verdictsFilter}
									onChange={onVerdictsFilterChange}
									disabled={!verdicts.length || isDiffMode || isDimMode}
								/>
								<DataTableFacetedFilter
									title="Parameters"
									size="xss"
									options={parameters}
									value={parametersFilter}
									onChange={(values) =>
										onFilterChange(COLUMN_ID.PARAMETERS, values)
									}
									disabled={!parameters.length || isDiffMode || isDimMode}
								/>
								<Tooltip content="Reset">
									<ButtonTw
										variant="secondary"
										size="xss"
										onClick={onClearFilters}
									>
										<Icon name="Bin" size={18} className="mr-1.5" />
										<span>Reset</span>
									</ButtonTw>
								</Tooltip>
							</div>
							<div className="flex gap-2 items-center">
								<Tooltip content="Click on the row to compare parameters">
									<ButtonTw
										variant={mode === 'diff' ? 'primary' : 'secondary'}
										size="xss"
										onClick={() => {
											const nextMode = mode === 'diff' ? 'default' : 'diff';
											setMode(nextMode);

											if (nextMode === 'diff') setColumnFilters([]);
										}}
									>
										<Icon
											name="SwapArrows"
											size={18}
											className="rotate-90 mr-1.5"
										/>
										<span>Parameters Compare</span>
									</ButtonTw>
								</Tooltip>
								<Tooltip content="Dim parameters that are the same. Click a row to compare against it.">
									<ButtonTw
										variant={isDimMode ? 'primary' : 'secondary'}
										size="xss"
										onClick={() => {
											const nextMode = isDimMode ? 'default' : 'dim';
											setMode(nextMode);
										}}
									>
										<Icon name="EyeHide" size={18} className="mr-1.5" />
										<span>Dim Common</span>
									</ButtonTw>
								</Tooltip>
							</div>
						</div>
					) : null}

					{table.getRowModel().rows.map((row, idx, arr) => (
						<ResultRow
							key={row.id}
							row={row}
							idx={idx}
							arr={arr}
							targetIterationId={targetIterationId}
							rowState={rowState}
							onRowClick={onRowClick}
						/>
					))}
				</div>
			</div>
		</div>
	);
});

interface ResultRowProps {
	row: Row<RunDataResults>;
	idx: number;
	arr: Row<RunDataResults>[];
	targetIterationId?: number;
	rowState?: RowState;
	onRowClick?: (row: Row<RunDataResults>) => void;
}

function ResultRow(props: ResultRowProps) {
	const { row, idx, arr, targetIterationId, rowState, onRowClick } = props;
	const firstCellRef = useRef<HTMLDivElement>(null);
	const isTarget = row.original.result_id === targetIterationId;
	const { setTargetIterationId } = useTargetIterationId();

	useMount(() => {
		if (!isTarget) return;
		firstCellRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		setTimeout(() => setTargetIterationId(null), 5000);
	});

	const [hovered, setHovered] = useState(false);

	return (
		<Fragment>
			{row.getVisibleCells().map((cell, cellIdx, cellArr) => {
				const className = cell.column.columnDef.meta?.['className'];
				const isReferenceDiffRow = rowState?.referenceDiffRowId === row.id;

				return (
					<div
						key={cell.id}
						onMouseEnter={() => setHovered(true)}
						onMouseLeave={() => setHovered(false)}
						className={cn(
							'px-1 py-2 bg-white text-text-primary text-[0.75rem] leading-[1.125rem] font-medium',
							'flex items-start whitespace-pre-wrap',
							'bg-primary-wash transition-colors',
							isReferenceDiffRow
								? 'border-y border-primary'
								: 'border-y border-y-transparent',
							idx !== arr.length - 1 && 'mb-1',
							cellIdx === 0 &&
								(isReferenceDiffRow
									? 'rounded-l-md border-l border-primary'
									: 'rounded-l-md border-l border-l-transparent'),
							cellIdx === cellArr.length - 1 &&
								(isReferenceDiffRow
									? 'rounded-r-md border-r border-primary'
									: 'rounded-r-md border-r border-r-transparent'),
							className,
							isTarget && 'animate-border-pulse',
							!isReferenceDiffRow &&
								hovered &&
								'border-y-primary border-l-primary border-r-primary'
						)}
						style={{
							overflowWrap: 'anywhere',
							cursor:
								rowState?.mode === 'diff' || rowState?.mode === 'dim'
									? 'pointer'
									: 'default'
						}}
						ref={cellIdx === 0 ? firstCellRef : undefined}
						onClick={() => onRowClick?.(row)}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</div>
				);
			})}
		</Fragment>
	);
}

interface StickyHeaderOptions {
	height: number;
}

function useStickyHeader({ height }: StickyHeaderOptions) {
	// Sticky offset is used for the useIsSticky hook to detect when header becomes sticky
	// Now that toolbar is below header, offset doesn't depend on toolbar visibility
	const stickyOffset = -(height + STICKY_OFFSET);

	const getHeaderProps = useCallback<
		NonNullable<TwTableProps<RunDataResults>['getHeaderProps']>
	>(
		(_, { isSticky }) => {
			return {
				style: {
					top: `${height + HEADER_HEIGHT}px`,
					position: 'sticky',
					boxShadow: isSticky ? '0 0 10px rgba(0, 0, 0, 0.1)' : 'none'
				} as CSSProperties
			};
		},
		[height]
	);

	return { stickyOffset, getHeaderProps };
}

interface GlobalRequirementsOptions {
	localRequirements: string[];
}

function useGlobalRequirementsFilters({
	localRequirements
}: GlobalRequirementsOptions) {
	const { globalRequirements, setGlobalRequirements } = useGlobalRequirements();

	const filteredGlobalRequirements = useMemo(
		() => globalRequirements.filter((r) => r !== null) as string[],
		[globalRequirements]
	);

	const hasGlobalRequirements = useMemo(
		() =>
			localRequirements.some((req) => filteredGlobalRequirements.includes(req)),
		[filteredGlobalRequirements, localRequirements]
	);

	const isSubmitButtonActive = useMemo(() => {
		return (
			localRequirements.length > 0 &&
			localRequirements.some((req) => !filteredGlobalRequirements.includes(req))
		);
	}, [filteredGlobalRequirements, localRequirements]);

	return {
		globalRequirements,
		setGlobalRequirements,
		isSubmitButtonActive,
		hasGlobalRequirements
	};
}

function useDataTableFilters(rowId: string, data: RunDataResults[]) {
	const { columnFilters, setColumnFilters, resetLocalRequirements } =
		useColumnFilters(rowId);

	const requirementsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.REQUIREMENTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const parametersFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.PARAMETERS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const verdictsFilter = useMemo(() => {
		return (
			(
				columnFilters.find((filter) => filter.id === COLUMN_ID.OBTAINED_RESULT)
					?.value as { verdicts?: string[] }
			)?.verdicts ?? []
		);
	}, [columnFilters]);

	const artifactsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.ARTIFACTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const filteredData = useMemo(() => {
		return data.filter((row) => {
			const hasEveryParameter = parametersFilter.every((parameter) =>
				row.parameters?.includes(parameter)
			);

			const hasEveryVerdict = verdictsFilter.every((verdict) =>
				row.obtained_result.verdicts?.includes(verdict)
			);

			const hasEveryArtifact = artifactsFilter.every((artifact) =>
				row.artifacts?.includes(artifact)
			);

			const hasEveryRequirement = requirementsFilter.every((requirement) =>
				row.requirements?.includes(requirement)
			);

			return (
				hasEveryParameter &&
				hasEveryVerdict &&
				hasEveryArtifact &&
				hasEveryRequirement
			);
		});
	}, [
		artifactsFilter,
		data,
		parametersFilter,
		requirementsFilter,
		verdictsFilter
	]);

	const requirements = useMemo(() => {
		return Array.from(
			new Set(filteredData.map((row) => row.requirements).flat())
		)
			.filter((requirement) => requirement !== undefined)
			.map((requirement) => ({
				label: requirement,
				value: requirement
			}));
	}, [filteredData]);

	const parameters = useMemo(() => {
		return Array.from(new Set(filteredData.map((row) => row.parameters).flat()))
			.filter(Boolean)
			.filter((parameter) => !parameter.includes('\n')) // Filter out formatted parameters
			.map((parameter) => ({
				label: parameter,
				value: parameter
			}));
	}, [filteredData]);

	const verdicts = useMemo(() => {
		return Array.from(
			new Set(filteredData.map((row) => row.obtained_result.verdicts).flat())
		)
			.filter(Boolean)
			.map((verdict) => ({
				label: verdict,
				value: verdict
			}));
	}, [filteredData]);

	const artifacts = useMemo(() => {
		return Array.from(new Set(filteredData.map((row) => row.artifacts).flat()))
			.filter(Boolean)
			.filter((artifact) => artifact !== undefined)
			.map((artifact) => ({
				label: artifact,
				value: artifact
			}));
	}, [filteredData]);

	function handleClearFilters() {
		setColumnFilters([]);
		resetLocalRequirements();
	}

	function handleFilterChange(id: string, values: string[] | undefined) {
		setColumnFilters((prev) => {
			const filter = prev.find((filter) => filter.id === id);

			if (filter) filter.value = values ?? [];

			return [...prev, { id, value: values ?? [] }];
		});
	}

	function handleVerdictsFilterChange(values: string[] | undefined) {
		setColumnFilters((prev) =>
			createNextState(prev, (draft) => {
				const filter = draft.find(
					(filter) => filter.id === COLUMN_ID.OBTAINED_RESULT
				) as { value?: { verdicts?: string[] } };

				if (filter) {
					if (!values?.length) {
						filter.value = { ...filter.value, verdicts: undefined };
					} else {
						filter.value = { ...filter.value, verdicts: values };
					}
				} else {
					draft.push({
						id: COLUMN_ID.OBTAINED_RESULT,
						value: { verdicts: values }
					});
				}
			})
		);
	}

	return {
		requirements,
		parameters,
		verdicts,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		artifactsFilter,
		onClearFilters: handleClearFilters,
		onFilterChange: handleFilterChange,
		onVerdictsFilterChange: handleVerdictsFilterChange
	};
}

const columnFiltersParam = withDefault(JsonParam, []);

function useColumnFilters(rowId: string) {
	const [queryColumnFilters, setQueryColumnFilters] = useQueryParam<
		Record<string, ColumnFiltersState>
	>('columnFilters', columnFiltersParam, { updateType: 'replaceIn' });
	const { localRequirements, setLocalRequirements } = useGlobalRequirements();

	const columnFilters = useMemo(() => {
		const currentFilters = queryColumnFilters?.[rowId] ?? [];
		const filtersWithoutRequirements = currentFilters.filter(
			(filter) => filter.id !== COLUMN_ID.REQUIREMENTS
		);

		return [
			...filtersWithoutRequirements,
			{ id: COLUMN_ID.REQUIREMENTS, value: localRequirements }
		];
	}, [localRequirements, queryColumnFilters, rowId]);

	const setColumnFilters = useCallback(
		(updater: Updater<ColumnFiltersState>) => {
			const nextState =
				typeof updater === 'function' ? updater(columnFilters) : updater;

			setQueryColumnFilters((prev) => ({ ...prev, [rowId]: nextState }));
		},
		[columnFilters, rowId, setQueryColumnFilters]
	);

	const resetLocalRequirements = useCallback(() => {
		setColumnFilters([]);
		setLocalRequirements([]);
	}, [setColumnFilters, setLocalRequirements]);

	const hasFilters = columnFilters.some((filter) => {
		const value = StringArraySchema.safeParse(filter.value);

		if (value.success) return value.data.length > 0;

		if (filter.id === COLUMN_ID.OBTAINED_RESULT) {
			const verdicts = ObtainedResultFilterSchema.safeParse(filter.value);

			if (!verdicts.success) return false;

			return (
				verdicts.data.verdicts.length > 0 || verdicts.data.result !== undefined
			);
		}

		return false;
	});

	return {
		columnFilters,
		setColumnFilters,
		hasFilters,
		resetLocalRequirements
	};
}
