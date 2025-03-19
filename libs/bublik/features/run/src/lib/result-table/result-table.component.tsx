/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, memo, useCallback, useMemo } from 'react';
import { ColumnFiltersState, Updater } from '@tanstack/react-table';
import { createNextState } from '@reduxjs/toolkit';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';

import { RunDataResults } from '@/shared/types';
import {
	TwTable,
	TableClassNames,
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
import { useGlobalRequirements } from '../hooks';

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

const gridClassName = 'grid grid-cols-[140px,0.6fr,0.6fr,0.6fr,0.6fr,1fr]';

const getBodyRowClassName = () => {
	return cn(
		gridClassName,
		'py-2 px-1 transition-colors',
		'border border-transparent hover:border-primary',
		'bg-primary-wash rounded-md'
	);
};

const classNames: TableClassNames<RunDataResults> = {
	headerRow: `h-[38px] grid sticky bg-primary-wash rounded-b ${gridClassName} px-4`,
	headerCell:
		'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: getBodyRowClassName,
	bodyCell: 'px-2'
};

export interface ResultTableProps {
	rowId: string;
	data: RunDataResults[];
	getRowProps: TwTableProps<RunDataResults>['getRowProps'];
	showLinkToRun?: boolean;
	height: number;
	mode?: 'default' | 'diff';
	setMode: (mode: 'default' | 'diff') => void;
	showToolbar: boolean;
	setShowToolbar: (showToolbar: boolean) => void;
}

export const ResultTable = memo(
	({
		data = [],
		rowId,
		getRowProps,
		showLinkToRun = false,
		height,
		mode = 'default',
		setMode,
		showToolbar,
		setShowToolbar
	}: ResultTableProps) => {
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
		const hasFilters = hasColumnFilters || hasGlobalRequirements;
		const hasToolbar = showToolbar || hasFilters || isDiffMode;

		const columns = useMemo(
			() =>
				getColumns({
					rowId,
					showLinkToRun,
					data,
					mode,
					showToolbar: hasToolbar,
					setShowToolbar
				}),
			[rowId, showLinkToRun, data, mode, hasToolbar, setShowToolbar]
		);

		const { stickyOffset, getHeaderProps } = useStickyHeader({
			hasFilters: hasToolbar,
			height
		});

		return (
			<div className="px-4 pb-2">
				{hasToolbar ? (
					<div
						className={cn(
							'flex items-center justify-between px-4',
							'bg-white h-9 sticky border-x border-b border-border-primary z-[1]'
						)}
						style={{ top: `${height + 102}px` }}
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
								disabled={!artifacts.length || isDiffMode}
							/>
							<DataTableFacetedFilter
								title="Verdicts"
								size="xss"
								options={verdicts}
								value={verdictsFilter}
								onChange={onVerdictsFilterChange}
								disabled={!verdicts.length || isDiffMode}
							/>
							<DataTableFacetedFilter
								title="Parameters"
								size="xss"
								options={parameters}
								value={parametersFilter}
								onChange={(values) =>
									onFilterChange(COLUMN_ID.PARAMETERS, values)
								}
								disabled={!parameters.length || isDiffMode}
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
									disabled
								>
									<Icon
										name="SwapArrows"
										size={18}
										className="rotate-90 mr-1.5"
									/>
									<span>Parameters Compare</span>
								</ButtonTw>
							</Tooltip>
						</div>
					</div>
				) : null}
				<TwTable
					data={data}
					getRowId={(row) => String(row.result_id)}
					columns={columns}
					classNames={classNames}
					stickyOffset={stickyOffset}
					manualPagination
					enableSorting={false}
					getRowProps={getRowProps}
					state={{ columnFilters }}
					onColumnFiltersChange={setColumnFilters}
					getHeaderProps={getHeaderProps}
				/>
			</div>
		);
	}
);

interface StickyHeaderOptions {
	hasFilters: boolean;
	height: number;
}

function useStickyHeader({ hasFilters, height }: StickyHeaderOptions) {
	const stickyOffset = hasFilters
		? -(height * 2 + STICKY_OFFSET)
		: -(height + STICKY_OFFSET);

	const getHeaderProps = useCallback<
		NonNullable<TwTableProps<RunDataResults>['getHeaderProps']>
	>(
		(_, { isSticky }) => {
			return {
				style: {
					top: `${
						hasFilters ? height * 2 + HEADER_HEIGHT : height + HEADER_HEIGHT
					}px`,
					position: 'sticky',
					boxShadow: isSticky ? '0 0 10px rgba(0, 0, 0, 0.1)' : 'none'
				} as CSSProperties
			};
		},
		[hasFilters, height]
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
				row.obtained_result.verdict?.includes(verdict)
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
			new Set(filteredData.map((row) => row.obtained_result.verdict).flat())
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
