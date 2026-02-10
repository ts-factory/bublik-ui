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

import { RESULT_PROPERTIES, RESULT_TYPE, RunDataResults } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	Badge,
	Icon,
	ButtonTw,
	VerdictList,
	cn,
	Tooltip
} from '@/shared/tailwind-ui';

import { KeyList } from './key-list';
import { getCommonParameters } from './matcher';
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

const helper = createColumnHelper<RunDataResults>();

interface GetColumnsOptions {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
	showToolbar?: boolean;
	setShowToolbar: (showToolbar: boolean) => void;
	path?: string;
}

export const getColumns = ({
	rowId,
	data,
	showLinkToRun = false,
	showToolbar = false,
	setShowToolbar,
	path
}: GetColumnsOptions) => {
	const parametersDataset = Object.fromEntries(
		data.map((item) => [String(item.result_id), item.parameters])
	);

	const commonParameters = getCommonParameters(
		data.map((item) => item.parameters ?? [])
	);

	return [
		helper.accessor((data) => data, {
			header: 'Actions',
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
			meta: { width: 'max-content', headerCellClassName: 'pl-9' }
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
					const resultProperty = obtainedResult.isNotExpected
						? RESULT_PROPERTIES.Unexpected
						: RESULT_PROPERTIES.Expected;
					const hasResultFilter =
						filterValue.results.length > 0 ||
						filterValue.resultProperties.length > 0;
					const isResultSelected =
						hasResultFilter &&
						(!filterValue.results.length ||
							filterValue.results.includes(obtainedResult.result)) &&
						(!filterValue.resultProperties.length ||
							filterValue.resultProperties.includes(resultProperty));

					if (!obtainedResult.result || !obtainedResult.verdicts) return;

					function handleVerdictClick(verdict: string) {
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
						cell.column.setFilterValue(
							createNextState(filterValue ?? {}, (draft) => {
								const isAlreadySelected =
									draft.results.length === 1 &&
									draft.resultProperties.length === 1 &&
									draft.results[0] === result &&
									draft.resultProperties[0] === resultProperty;

								if (isAlreadySelected) {
									draft.results = [];
									draft.resultProperties = [];
									return;
								}

								draft.results = [result];
								draft.resultProperties = [resultProperty];
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
							isResultSelected={isResultSelected}
						/>
					);
				},
				filterFn: (
					row,
					column,
					filterValue: {
						results?: RESULT_TYPE[];
						resultProperties?: RESULT_PROPERTIES[];
						verdicts?: string[];
					}
				) => {
					const value = row.getValue(column) as {
						isNotExpected?: boolean;
						result?: RESULT_TYPE;
						verdicts?: string[];
					};
					const rowResultProperty =
						typeof value.isNotExpected === 'boolean'
							? value.isNotExpected
								? RESULT_PROPERTIES.Unexpected
								: RESULT_PROPERTIES.Expected
							: undefined;

					if (
						!filterValue?.results?.length &&
						!filterValue?.resultProperties?.length &&
						!filterValue?.verdicts?.length
					) {
						return true;
					}

					const matchesResult =
						!filterValue.results?.length ||
						(value.result ? filterValue.results.includes(value.result) : false);
					const matchesResultProperties =
						!filterValue.resultProperties?.length ||
						(rowResultProperty
							? filterValue.resultProperties.includes(rowResultProperty)
							: false);
					const matchesVerdicts =
						!filterValue.verdicts?.length ||
						filterValue.verdicts.every((v) => value.verdicts?.includes(v));

					return matchesResult && matchesResultProperties && matchesVerdicts;
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
			header: () => (
				<div className="flex items-center gap-2">
					<span>Parameters</span>
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
			id: COLUMN_ID.PARAMETERS,
			cell: ({ cell, getValue }) => {
				const parameters = getValue();
				const column = cell.column;

				const referenceDiffRowId =
					// eslint-disable-next-line react-hooks/rules-of-hooks
					useRunTableRowState().rowState[rowId]?.referenceDiffRowId;
				const referenceParameters = referenceDiffRowId
					? parametersDataset[referenceDiffRowId]
					: undefined;
				const hasReferenceRow = Boolean(referenceParameters);
				const filterValue = (column.getFilterValue() ?? []) as string[];

				const reference = referenceParameters ?? parameters;

				function handleParameterClick(value: string) {
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
						commonParameters={commonParameters}
						hasReferenceRow={hasReferenceRow}
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

	return filterValue.every((value) => cellValue.includes(value));
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
	commonParameters?: Set<string>;
	hasReferenceRow: boolean;
}

function Parameters(props: ParametersProps) {
	const {
		filterValue,
		parameters,
		reference,
		onParameterClick,
		commonParameters,
		hasReferenceRow
	} = props;

	// Pre-compute Set for O(1) lookups when reference row is selected
	const referenceSet = useMemo(() => new Set(reference), [reference]);

	return (
		<ul className="flex gap-1 flex-wrap">
			{parameters.map((value, index) => {
				const isSelected = filterValue.includes(value);
				const shouldDim = hasReferenceRow
					? referenceSet.has(value)
					: commonParameters?.has(value);

				return (
					<button
						key={index}
						className={cn(
							'inline-flex items-center w-fit py-0.5 px-2 rounded border border-transparent text-[0.75rem] font-medium transition-colors bg-badge-0',
							isSelected ? 'bg-primary-wash border-primary' : 'bg-badge-1',
							shouldDim && !isSelected && 'opacity-60'
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
