/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, Fragment, useMemo } from 'react';
import {
	ColumnDef,
	createColumnHelper,
	Row,
	RowData
} from '@tanstack/react-table';
import { createNextState } from '@reduxjs/toolkit';

import { RESULT_TYPE, RunDataResults } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	Badge,
	Icon,
	ButtonTw,
	VerdictList,
	cn,
	Tooltip,
	toast
} from '@/shared/tailwind-ui';

import { KeyList } from './key-list';
import { highlightDifferences, getCommonParameters } from './matcher';
import { useGlobalRequirements, useRunTableRowState } from '../hooks';
import { COLUMN_ID, ObtainedResultFilterSchema } from './constants';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		style?: CSSProperties;
		width?: string;
		className?: string;
		headerCellClassName?: string;
	}
}

function filterModeWarning() {
	toast.warning('Parameters compare mode is enabled. Filters are disabled.');
}

const helper = createColumnHelper<RunDataResults>();

interface GetColumnsOptions {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
	mode?: 'default' | 'diff' | 'dim';
	showToolbar?: boolean;
	setShowToolbar: (showToolbar: boolean) => void;
	path?: string;
}

export const getColumns = ({
	rowId,
	data,
	showLinkToRun = false,
	mode = 'default',
	showToolbar = false,
	setShowToolbar,
	path
}: GetColumnsOptions) => {
	const parametersDataset = Object.fromEntries(
		data.map((item) => [String(item.result_id), item.parameters])
	);

	// Compute common parameters across all rows (only needed when in dim mode)
	const commonParameters =
		mode === 'dim'
			? getCommonParameters(data.map((item) => item.parameters ?? []))
			: undefined;

	return [
		helper.accessor((data) => data, {
			header: () => (
				<div className="flex items-center gap-2">
					<span>Actions</span>
					<Tooltip content={showToolbar ? 'Hide toolbar' : 'Show toolbar'}>
						<ButtonTw
							variant={showToolbar ? 'primary' : 'secondary'}
							size="xss"
							onClick={() => setShowToolbar(!showToolbar)}
							className={cn(
								'border',
								showToolbar
									? 'border-primary hover:border-[#94b0ff]'
									: 'border-border-primary hover:shadow-none hover:border-primary'
							)}
						>
							<div
								className={cn(
									'flex items-center justify-center mr-1.5',
									!showToolbar && 'rotate-180'
								)}
							>
								<Icon name="ArrowLeanUp" size={18} />
							</div>
							<span className="w-[6ch] text-left">
								{showToolbar ? 'Hide' : 'Expose'}
							</span>
						</ButtonTw>
					</Tooltip>
				</div>
			),
			id: 'links',
			cell: (cell) => {
				const value = cell.getValue();

				return (
					<div className="flex items-center h-full">
						<ResultLinksContainer
							runId={value.run_id}
							resultId={value.result_id}
							result={value}
							showLinkToRun={showLinkToRun}
							path={path}
						/>
					</div>
				);
			},
			meta: { width: 'max-content' }
		}),
		helper.accessor(
			(data) => ({
				isNotExpected: data.has_error,
				verdicts: data.obtained_result.verdicts,
				result: data.obtained_result.result_type
			}),
			{
				header: 'Obtained Result',
				id: COLUMN_ID.OBTAINED_RESULT,
				cell: (cell) => {
					const obtainedResult = cell.getValue();
					const filterValue = ObtainedResultFilterSchema.parse(
						cell.column.getFilterValue()
					);

					const verdicts = filterValue?.verdicts ?? [];

					if (!obtainedResult.result || !obtainedResult.verdicts) return;

					function handleVerdictClick(verdict: string) {
						if (mode === 'diff') {
							filterModeWarning();
							return;
						}

						cell.column.setFilterValue(
							createNextState(filterValue ?? {}, (draft) => {
								if (!draft.verdicts) {
									draft.verdicts = [verdict];
									return;
								}

								if (draft.verdicts.includes(verdict)) {
									draft.verdicts = draft.verdicts.filter((v) => v !== verdict);
								} else {
									draft.verdicts = [...draft.verdicts, verdict];
								}
							})
						);
					}

					function handleResultClick(result: RESULT_TYPE) {
						if (mode === 'diff') {
							filterModeWarning();
							return;
						}

						cell.column.setFilterValue(
							createNextState(filterValue ?? {}, (draft) => {
								if (
									draft.result === result &&
									draft.isNotExpected === obtainedResult.isNotExpected
								) {
									draft.result = undefined;
									draft.isNotExpected = undefined;
								} else {
									draft.result = result;
									draft.isNotExpected = obtainedResult.isNotExpected;
								}
							})
						);
					}

					return (
						<VerdictList
							variant="obtained"
							verdicts={obtainedResult.verdicts}
							result={obtainedResult.result}
							isNotExpected={obtainedResult.isNotExpected}
							onVerdictClick={handleVerdictClick}
							selectedVerdicts={verdicts}
							onResultClick={handleResultClick}
							isResultSelected={
								obtainedResult.result === filterValue?.result &&
								obtainedResult.isNotExpected === filterValue?.isNotExpected
							}
						/>
					);
				},
				filterFn: (
					row,
					column,
					filterValue: {
						result?: RESULT_TYPE;
						verdicts?: string[];
						isNotExpected?: boolean;
					}
				) => {
					const value = row.getValue(column) as {
						isNotExpected?: boolean;
						result?: RESULT_TYPE;
						verdicts?: string[];
					};

					if (!filterValue?.result && !filterValue?.verdicts?.length) {
						return true;
					}

					const matchesResult =
						!filterValue.result ||
						(value.result === filterValue.result &&
							value.isNotExpected === filterValue.isNotExpected);
					const matchesVerdicts =
						!filterValue.verdicts?.length ||
						filterValue.verdicts.every((v) => value.verdicts?.includes(v));

					return matchesResult && matchesVerdicts;
				},
				meta: { headerCellClassName: 'pl-[12px]' }
			}
		),
		helper.accessor('expected_results', {
			header: 'Expected Results',
			cell: (cell) => {
				const expectedResults = cell.getValue();

				if (expectedResults.length === 0) return;

				return (
					<div className="flex flex-col flex-wrap gap-1">
						{expectedResults.map((result, idx) => {
							return (
								<Fragment key={idx}>
									{result.verdicts && result.result_type ? (
										<VerdictList
											variant="expected"
											verdicts={result.verdicts}
											result={result.result_type}
										/>
									) : null}
									{result?.keys?.length && result.keys ? (
										<KeyList items={result.keys} />
									) : null}
								</Fragment>
							);
						})}
					</div>
				);
			},
			meta: { headerCellClassName: 'pl-[12px]' }
		}),
		helper.accessor('artifacts', {
			header: 'Artifacts',
			id: COLUMN_ID.ARTIFACTS,
			cell: (cell) => {
				const filterValue = (cell.column.getFilterValue() ?? []) as string[];

				function handleArtifactClick(artifact: string) {
					if (mode === 'diff') {
						filterModeWarning();
						return;
					}

					cell.column.setFilterValue(
						filterValue.includes(artifact)
							? filterValue.filter((v) => v !== artifact)
							: [...filterValue, artifact]
					);
				}

				return (
					<div className="flex flex-col flex-wrap gap-1">
						<ArtifactsList
							artifacts={cell.getValue()}
							filterValue={filterValue}
							onArtifactClick={handleArtifactClick}
						/>
					</div>
				);
			},
			filterFn: fitlerIncludesSome,
			meta: { headerCellClassName: 'pl-[12px]' }
		}),
		helper.accessor('parameters', {
			header: 'Parameters',
			id: COLUMN_ID.PARAMETERS,
			cell: ({ cell, getValue }) => {
				const parameters = getValue();
				const column = cell.column;

				const referenceDiffRowId =
					// eslint-disable-next-line react-hooks/rules-of-hooks
					useRunTableRowState().rowState[rowId]?.referenceDiffRowId;
				const filterValue = (column.getFilterValue() ?? []) as string[];

				const reference = referenceDiffRowId
					? parametersDataset[referenceDiffRowId]
					: parameters;

				function handleParameterClick(value: string) {
					if (mode === 'diff' || mode === 'dim') {
						filterModeWarning();
						return;
					}

					column.setFilterValue(
						filterValue?.includes(value)
							? filterValue.filter((v) => v !== value)
							: [...filterValue, value]
					);
				}

				return (
					<Parameters
						parameters={parameters}
						reference={reference}
						filterValue={filterValue}
						onParameterClick={handleParameterClick}
						mode={mode}
						commonParameters={commonParameters}
					/>
				);
			},
			filterFn: fitlerIncludesSome,
			meta: { headerCellClassName: 'pl-[12px]' }
		}),
		helper.accessor('requirements', {
			header: 'Requirements',
			id: COLUMN_ID.REQUIREMENTS,
			cell: (cell) => {
				const requirements = cell.getValue() ?? [];
				const filterValue = (cell.column.getFilterValue() ?? []) as string[];

				function handleRequirementClick(requirement: string) {
					if (mode === 'diff') {
						filterModeWarning();
						return;
					}

					cell.column.setFilterValue(
						filterValue.includes(requirement)
							? filterValue.filter((v) => v !== requirement)
							: [...filterValue, requirement]
					);
				}

				return (
					<RequirementsList
						requirements={requirements}
						onRequirementClick={handleRequirementClick}
					/>
				);
			},
			filterFn: fitlerIncludesSome,
			meta: { headerCellClassName: 'pl-[12px]' }
		})
	] as ColumnDef<RunDataResults>[];
};

function fitlerIncludesSome<T extends Record<string, unknown>>(
	row: Row<T>,
	column: string,
	filterValue: string[]
) {
	const cellValue = (row.original[column] ?? []) as string[];

	return filterValue.every((value) => cellValue.some((v) => v.includes(value)));
}

interface ArtifactsListProps {
	artifacts?: string[];
	filterValue: string[];
	onArtifactClick: (artifact: string) => void;
}

function ArtifactsList(props: ArtifactsListProps) {
	const { artifacts, filterValue, onArtifactClick } = props;

	if (!artifacts) return null;

	return (
		<ul className="flex flex-col flex-wrap gap-1">
			{artifacts.map((artifact) => {
				return (
					<Badge
						key={artifact}
						className="text-start bg-badge-16"
						overflowWrap
						isSelected={filterValue.includes(artifact)}
						onClick={() => onArtifactClick(artifact)}
					>
						{artifact}
					</Badge>
				);
			})}
		</ul>
	);
}

interface RequirementsListProps {
	requirements?: string[];
	onRequirementClick: (requirement: string) => void;
}

function RequirementsList(props: RequirementsListProps) {
	const { requirements, onRequirementClick } = props;
	const { setLocalRequirements, localRequirements } = useGlobalRequirements();

	function handleRequirementClick(requirement: string) {
		setLocalRequirements(
			localRequirements.includes(requirement)
				? localRequirements.filter((v) => v !== requirement)
				: [...localRequirements, requirement]
		);
		onRequirementClick(requirement);
	}

	if (!requirements) return null;

	return (
		<ul className="flex flex-col flex-wrap gap-1">
			{requirements.map((requirement) => {
				return (
					<Badge
						key={requirement}
						className="text-start bg-badge-2"
						overflowWrap
						isSelected={localRequirements.includes(requirement)}
						onClick={() => handleRequirementClick(requirement)}
					>
						{requirement}
					</Badge>
				);
			})}
		</ul>
	);
}

interface ParametersProps {
	filterValue: string[];
	parameters: string[];
	reference: string[];
	onParameterClick: (value: string) => void;
	mode?: 'default' | 'diff' | 'dim';
	commonParameters?: Set<string>;
}

function Parameters(props: ParametersProps) {
	const {
		filterValue,
		parameters,
		reference,
		onParameterClick,
		mode,
		commonParameters
	} = props;

	// Only compute differences in diff mode
	const diffResults =
		mode === 'diff' ? highlightDifferences(parameters, reference) : null;

	// Pre-compute Set for O(1) lookups when in dim mode
	const referenceSet = useMemo(() => new Set(reference), [reference]);

	return (
		<ul className="flex gap-1 flex-wrap">
			{(mode === 'diff' ? diffResults! : parameters).map((item, index) => {
				// Handle different item types based on mode
				const value = typeof item === 'string' ? item : item.value;
				const isDifferent =
					mode === 'diff' && (item as { isDifferent?: boolean }).isDifferent;

				// Determine if this parameter should be dimmed (only in dim mode)
				const shouldDim =
					mode === 'dim' &&
					// If reference === parameters (no row selected), dim globally common params
					(reference === parameters
						? commonParameters?.has(value)
						: // If row selected, dim parameters that exist in reference (same value)
						  referenceSet.has(value));

				return (
					<button
						key={index}
						className={cn(
							'inline-flex items-center w-fit py-0.5 px-2 rounded border border-transparent text-[0.75rem] font-medium transition-colors bg-badge-0',
							// Highlight logic for diff mode and filtered params
							filterValue.includes(value) || isDifferent
								? 'bg-primary-wash border-primary'
								: 'bg-badge-1',
							// Dim common parameters when in dim mode
							shouldDim && 'opacity-40'
						)}
						onClick={() => onParameterClick(value)}
					>
						{value}
					</button>
				);
			})}
		</ul>
	);
}
