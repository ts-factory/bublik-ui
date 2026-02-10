/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CSSProperties,
	Fragment,
	MouseEvent as ReactMouseEvent,
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
import { RESULT_PROPERTIES, RESULT_TYPE, RunDataResults } from '@/shared/types';
import {
	cn,
	Skeleton,
	TwTableProps,
	ButtonTw,
	Icon,
	DataTableFacetedFilter,
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

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
const RESULT_PROPERTIES_LABEL: Record<RESULT_PROPERTIES, string> = {
	[RESULT_PROPERTIES.Expected]: 'Expected',
	[RESULT_PROPERTIES.Unexpected]: 'Unexpected',
	[RESULT_PROPERTIES.NotRun]: 'Not Run'
};

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

export interface ResultTableErrorProps {
	error: unknown;
}

export const ResultTableError = ({ error }: ResultTableErrorProps) => {
	return <BublikErrorState error={error} />;
};

export const ResultTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No data"
			description="No result table data available"
		/>
	);
};

export interface ResultTableProps {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
	height: number;
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
		results,
		resultProperties,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		resultsFilter,
		resultPropertiesFilter,
		artifactsFilter,
		onClearFilters,
		onFilterChange,
		onVerdictsFilterChange,
		onResultsFilterChange,
		onResultPropertiesFilterChange
	} = useDataTableFilters(rowId, data);
	const { hasGlobalRequirements } = useGlobalRequirementsFilters({
		localRequirements: requirementsFilter
	});
	const hasFilters = hasColumnFilters || hasGlobalRequirements;
	const hasToolbar = showToolbar || hasFilters;

	const columns = useMemo(
		() =>
			getColumns({
				rowId,
				showLinkToRun,
				data,
				showToolbar: hasToolbar,
				setShowToolbar,
				path
			}),
		[rowId, showLinkToRun, data, hasToolbar, setShowToolbar, path]
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
									title="Obtained Result"
									size="xss"
									options={results}
									value={resultsFilter}
									onChange={onResultsFilterChange}
									disabled={!results.length}
								/>
								<DataTableFacetedFilter
									title="Result Type"
									size="xss"
									options={resultProperties}
									value={resultPropertiesFilter}
									onChange={onResultPropertiesFilterChange}
									disabled={!resultProperties.length}
								/>
								<DataTableFacetedFilter
									title="Verdicts"
									size="xss"
									options={verdicts}
									value={verdictsFilter}
									onChange={onVerdictsFilterChange}
									disabled={!verdicts.length}
								/>
								<DataTableFacetedFilter
									title="Artifacts"
									size="xss"
									options={artifacts}
									value={artifactsFilter}
									onChange={(values) =>
										onFilterChange(COLUMN_ID.ARTIFACTS, values)
									}
									disabled={!artifacts.length}
								/>
								<DataTableFacetedFilter
									title="Parameters"
									size="xss"
									options={parameters}
									value={parametersFilter}
									onChange={(values) =>
										onFilterChange(COLUMN_ID.PARAMETERS, values)
									}
									disabled={!parameters.length}
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
	const INTERACTIVE_SELECTOR =
		'button, a, input, select, textarea, [role="button"], [data-stop-row-click="true"]';

	useMount(() => {
		if (!isTarget) return;
		firstCellRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		setTimeout(() => setTargetIterationId(null), 5000);
	});

	const [hovered, setHovered] = useState(false);

	function handleRowClick(event: ReactMouseEvent<HTMLDivElement>) {
		const target = event.target as HTMLElement;
		const interactiveParent = target.closest(INTERACTIVE_SELECTOR);

		if (interactiveParent) return;

		onRowClick?.(row);
	}

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
							cursor: onRowClick ? 'pointer' : 'default'
						}}
						ref={cellIdx === 0 ? firstCellRef : undefined}
						onClick={handleRowClick}
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
	const resultValues = new Set(Object.values(RESULT_TYPE));
	const resultPropertiesValues = new Set<RESULT_PROPERTIES>([
		RESULT_PROPERTIES.Expected,
		RESULT_PROPERTIES.Unexpected,
		RESULT_PROPERTIES.NotRun
	]);

	const requirementsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.REQUIREMENTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const parametersFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.PARAMETERS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const obtainedResultFilter = useMemo(() => {
		return ObtainedResultFilterSchema.parse(
			columnFilters.find((filter) => filter.id === COLUMN_ID.OBTAINED_RESULT)
				?.value
		);
	}, [columnFilters]);

	const verdictsFilter = obtainedResultFilter.verdicts;
	const resultsFilter = obtainedResultFilter.results;
	const resultPropertiesFilter = obtainedResultFilter.resultProperties;

	const artifactsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.ARTIFACTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const {
		filteredData,
		filteredDataWithoutResults,
		filteredDataWithoutResultProperties
	} = useMemo(() => {
		const matchesRow = (
			row: RunDataResults,
			{
				includeResults,
				includeResultProperties
			}: { includeResults: boolean; includeResultProperties: boolean }
		) => {
			const rowResultProperty = row.has_error
				? RESULT_PROPERTIES.Unexpected
				: RESULT_PROPERTIES.Expected;
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
			const matchesResult =
				!includeResults ||
				!resultsFilter.length ||
				resultsFilter.includes(row.obtained_result.result_type);
			const matchesResultProperties =
				!includeResultProperties ||
				!resultPropertiesFilter.length ||
				resultPropertiesFilter.includes(rowResultProperty);

			return (
				hasEveryParameter &&
				hasEveryVerdict &&
				hasEveryArtifact &&
				hasEveryRequirement &&
				matchesResult &&
				matchesResultProperties
			);
		};

		return {
			filteredData: data.filter((row) =>
				matchesRow(row, {
					includeResults: true,
					includeResultProperties: true
				})
			),
			filteredDataWithoutResults: data.filter((row) =>
				matchesRow(row, {
					includeResults: false,
					includeResultProperties: true
				})
			),
			filteredDataWithoutResultProperties: data.filter((row) =>
				matchesRow(row, {
					includeResults: true,
					includeResultProperties: false
				})
			)
		};
	}, [
		artifactsFilter,
		data,
		parametersFilter,
		requirementsFilter,
		resultPropertiesFilter,
		resultsFilter,
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

	const results = useMemo(() => {
		const orderedResultTypes = Object.values(RESULT_TYPE);

		return Array.from(
			new Set(
				filteredDataWithoutResults.map((row) => row.obtained_result.result_type)
			)
		)
			.filter(Boolean)
			.sort(
				(a, b) => orderedResultTypes.indexOf(a) - orderedResultTypes.indexOf(b)
			)
			.map((result) => ({
				label: result,
				value: result
			}));
	}, [filteredDataWithoutResults]);

	const resultProperties = useMemo(() => {
		return Array.from(
			new Set(
				filteredDataWithoutResultProperties.map((row) =>
					row.has_error
						? RESULT_PROPERTIES.Unexpected
						: RESULT_PROPERTIES.Expected
				)
			)
		)
			.filter((resultProperty) => resultProperty !== undefined)
			.map((resultProperty) => ({
				label: RESULT_PROPERTIES_LABEL[resultProperty],
				value: resultProperty
			}));
	}, [filteredDataWithoutResultProperties]);

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
		setColumnFilters((prev) =>
			createNextState(prev, (draft) => {
				const index = draft.findIndex((filter) => filter.id === id);
				const nextValue = values ?? [];

				if (nextValue.length === 0) {
					if (index !== -1) {
						draft.splice(index, 1);
					}
					return;
				}

				if (index === -1) {
					draft.push({ id, value: nextValue });
					return;
				}

				draft[index].value = nextValue;
			})
		);
	}

	function handleObtainedResultFilterChange(
		updater: (
			filter: ReturnType<typeof ObtainedResultFilterSchema.parse>
		) => ReturnType<typeof ObtainedResultFilterSchema.parse>
	) {
		setColumnFilters((prev) =>
			createNextState(prev, (draft) => {
				const index = draft.findIndex(
					(filter) => filter.id === COLUMN_ID.OBTAINED_RESULT
				);
				const currentFilter =
					index === -1
						? ObtainedResultFilterSchema.parse(undefined)
						: ObtainedResultFilterSchema.parse(draft[index].value);
				const nextFilter = updater(currentFilter);
				const hasValues =
					nextFilter.verdicts.length > 0 ||
					nextFilter.results.length > 0 ||
					nextFilter.resultProperties.length > 0;

				if (!hasValues) {
					if (index !== -1) {
						draft.splice(index, 1);
					}
					return;
				}

				if (index === -1) {
					draft.push({ id: COLUMN_ID.OBTAINED_RESULT, value: nextFilter });
					return;
				}

				draft[index].value = nextFilter;
			})
		);
	}

	function handleVerdictsFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			verdicts: values ?? []
		}));
	}

	function handleResultsFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			results: (values ?? []).filter((value): value is RESULT_TYPE =>
				resultValues.has(value as RESULT_TYPE)
			)
		}));
	}

	function handleResultPropertiesFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			resultProperties: (values ?? []).filter(
				(value): value is RESULT_PROPERTIES =>
					resultPropertiesValues.has(value as RESULT_PROPERTIES)
			)
		}));
	}

	return {
		requirements,
		parameters,
		verdicts,
		results,
		resultProperties,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		resultsFilter,
		resultPropertiesFilter,
		artifactsFilter,
		onClearFilters: handleClearFilters,
		onFilterChange: handleFilterChange,
		onVerdictsFilterChange: handleVerdictsFilterChange,
		onResultsFilterChange: handleResultsFilterChange,
		onResultPropertiesFilterChange: handleResultPropertiesFilterChange
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
			const obtainedResult = ObtainedResultFilterSchema.safeParse(filter.value);

			if (!obtainedResult.success) return false;

			return (
				obtainedResult.data.verdicts.length > 0 ||
				obtainedResult.data.results.length > 0 ||
				obtainedResult.data.resultProperties.length > 0
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
