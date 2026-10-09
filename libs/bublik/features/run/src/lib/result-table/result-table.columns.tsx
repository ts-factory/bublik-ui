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

import {
	IssueCategory,
	RESULT_PROPERTIES,
	RESULT_TYPE,
	ResultIssueRef,
	RunDataResults
} from '@/shared/types';
import { config } from '@/bublik/config';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	ResultIssueBadges,
	resultClassification,
	useResultSelection
} from '@/bublik/features/result-classification';
import {
	Badge,
	ParameterValue,
	VerdictList,
	cn,
	Tooltip
} from '@/shared/tailwind-ui';
import {
	formatTimeToDot,
	formatTimestampToFull,
	parseParameter
} from '@/shared/utils';

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
	/**
	 * Lead with the test each row belongs to. Off under the run table, where
	 * every row is the one test the table was opened from; on when the rows
	 * span tests and runs, as an issue's results do.
	 */
	showTest?: boolean;
	/** The test path shared by every row. Omit it and each row's own is used. */
	path?: string;
}

/**
 * The package chain above the test, e.g. `pkg1/pkg2` for
 * `pkg1/pkg2/testpmd_txonly` — what tells apart two tests sharing a name.
 */
function packagePathOf(path: string | null | undefined, name: string): string {
	if (!path) return '';
	if (name && path.endsWith(`/${name}`)) return path.slice(0, -name.length - 1);

	return path === name ? '' : path;
}

export const getColumns = ({
	rowId,
	data,
	showLinkToRun = false,
	showTest = false,
	path
}: GetColumnsOptions) => {
	const parametersDataset = Object.fromEntries(
		data.map((item) => [String(item.result_id), item.parameters])
	);

	const commonParameters = getCommonParameters(
		data.map((item) => item.parameters ?? [])
	);

	const testColumn = helper.accessor((data) => data, {
		header: 'Test',
		id: 'test',
		cell: (cell) => {
			const { name, path: rowPath, start } = cell.getValue();
			const packagePath = packagePathOf(rowPath, name);

			// The rows are tall anyway, so the name and the path wrap rather
			// than truncate: cut from the right, a path would keep its root and
			// lose the leaf package, which is what tells tests apart. The path
			// breaks only at its slashes, dimmed so the segments read as a trail.
			return (
				<div className="flex flex-col min-w-0" title={rowPath || name}>
					<div className="flex items-center">
						<span className="min-w-0 font-medium">{name}</span>
					</div>
					{packagePath ? (
						<span className="text-[0.6875rem] text-text-menu">
							{packagePath.split('/').map((segment, idx) => (
								<Fragment key={idx}>
									{idx > 0 ? (
										<>
											<span className="text-text-menu/50">/</span>
											<wbr />
										</>
									) : null}
									{segment}
								</Fragment>
							))}
						</span>
					) : null}
					<Tooltip content={formatTimestampToFull(start)}>
						<span className="w-fit text-[0.6875rem] text-text-menu tabular-nums">
							{formatTimeToDot(start)}
						</span>
					</Tooltip>
				</div>
			);
		},
		// As wide as its longest name, up to a cap the name then wraps at;
		// not a share of the free space, which the result columns need.
		meta: { width: 'fit-content(14rem)', headerCellClassName: 'pl-[12px]' }
	});

	return [
		helper.accessor((data) => data, {
			header: 'Actions',
			id: 'links',
			cell: (cell) => {
				const value = cell.getValue();

				return (
					<div className="flex items-start gap-2">
						<ResultLinksContainer
							runId={value.run_id}
							resultId={value.result_id}
							result={value}
							showLinkToRun={showLinkToRun}
							path={path ?? value.path ?? undefined}
						/>
					</div>
				);
			},
			meta: { width: 'max-content', headerCellClassName: 'pl-9' }
		}),
		...(showTest ? [testColumn] : []),
		helper.accessor(
			(data) => ({
				isNotExpected: data.has_error,
				// `has_error` is already suppressed server-side, so it cannot tell a
				// held-back failure from a pass. This can.
				effectiveExpected: data.effective_expected,
				verdicts: data.obtained_result.verdicts,
				result: data.obtained_result.result_type,
				issues: data.issues
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

					// Toggling a category chip is the same write as ticking the
					// Category box in the toolbar: both land on this column's filter,
					// which is where the chips already live.
					function handleCategoryClick(category: IssueCategory) {
						cell.column.setFilterValue(
							createNextState(filterValue ?? {}, (draft) => {
								const selected = draft.categories ?? [];

								draft.categories = selected.includes(category)
									? selected.filter((c) => c !== category)
									: [...selected, category];
							})
						);
					}

					// No result to render, but the stamps beneath it still are.
					if (!obtainedResult.result || !obtainedResult.verdicts) {
						return (
							<div className="flex flex-col gap-1.5">
								<ResultIssueBadges
									issues={obtainedResult.issues}
									selectedCategories={filterValue.categories}
									onCategoryClick={handleCategoryClick}
								/>
							</div>
						);
					}

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

					// The verdict qualifies the result badge, so it rides on its line;
					// the stamps that explain it go under the verdicts, exactly as the
					// history table lays it out. Both used to sit in the Actions
					// column, among the links, widening a column meant for buttons.
					return (
						<div className="flex flex-col gap-1.5">
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
							<ResultIssueBadges
								issues={obtainedResult.issues}
								selectedCategories={filterValue.categories}
								onCategoryClick={handleCategoryClick}
								withSeparator
							/>
						</div>
					);
				},
				filterFn: (
					row,
					column,
					filterValue: {
						results?: RESULT_TYPE[];
						resultProperties?: RESULT_PROPERTIES[];
						verdicts?: string[];
						categories?: string[];
						classifications?: string[];
					}
				) => {
					const value = row.getValue(column) as {
						isNotExpected?: boolean;
						effectiveExpected?: boolean;
						result?: RESULT_TYPE;
						verdicts?: string[];
						issues?: ResultIssueRef[];
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
						!filterValue?.verdicts?.length &&
						!filterValue?.categories?.length &&
						!filterValue?.classifications?.length
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
					// Any, not every: a result carries one stamp per matching rule, and
					// selecting DEFECT and KNOWN asks for the results either explains,
					// not the rare ones both do.
					const matchesCategories =
						!filterValue.categories?.length ||
						(value.issues ?? []).some((issue) =>
							filterValue.categories?.includes(issue.category)
						);
					// A result carries exactly one verdict, so this is a plain
					// membership test rather than the some/every question the
					// per-stamp axes ask. `null` is a passing result with no stamps:
					// it shows no chip, so no chip's filter should claim it.
					const classification = resultClassification({
						issues: value.issues,
						hasError: Boolean(value.isNotExpected),
						effectiveExpected: value.effectiveExpected
					});
					const matchesClassifications =
						!filterValue.classifications?.length ||
						(classification
							? filterValue.classifications.includes(classification.value)
							: false);

					return (
						matchesResult &&
						matchesResultProperties &&
						matchesVerdicts &&
						matchesCategories &&
						matchesClassifications
					);
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
										<KeyList
											items={result.keys.map(({ url, ...key }) => ({
												...key,
												url: url ?? undefined
											}))}
										/>
									) : null}
								</Fragment>
							);
						})}
					</div>
				);
			},
			// Sized to its content, capped: most rows expect one badge, and
			// the slack is better spent on the obtained result beside it, which
			// carries the verdicts and the stamps.
			meta: { width: 'fit-content(20rem)', headerCellClassName: 'pl-[12px]' }
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
			header: 'Parameters',
			id: COLUMN_ID.PARAMETERS,
			cell: ({ cell, getValue }) => {
				const parameters = getValue();
				const column = cell.column;

				// Under a selection the reference is the one the bar's Compare
				// took, for every table on the page; elsewhere it is the row the
				// table's own click picked.
				// eslint-disable-next-line react-hooks/rules-of-hooks
				const selection = useResultSelection();
				const ownReferenceRowId =
					// eslint-disable-next-line react-hooks/rules-of-hooks
					useRunTableRowState().rowState[rowId]?.referenceDiffRowId;
				const referenceDiffRowId = selection
					? selection.referenceResultId !== null
						? String(selection.referenceResultId)
						: undefined
					: ownReferenceRowId;
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

	const { plain, preformatted } = useMemo(() => {
		const parsed = parameters.map((value) => ({
			value,
			parsed: parseParameter(value, config.keyValueSubmitDelimiter)
		}));

		return {
			plain: parsed.filter((item) => !item.parsed.isPreformatted),
			preformatted: parsed.filter((item) => item.parsed.isPreformatted)
		};
	}, [parameters]);

	function renderParameter(
		{ value, parsed }: (typeof plain)[number],
		mode: 'badge' | 'pre'
	) {
		const isSelected = filterValue.includes(value);
		const shouldDim = hasReferenceRow
			? referenceSet.has(value)
			: commonParameters?.has(value);

		return (
			<ParameterValue
				key={value}
				name={parsed.name}
				value={parsed.value}
				mode={mode}
				isSelected={isSelected}
				onClick={() => onParameterClick(value)}
				className={cn(
					'bg-badge-1 cursor-pointer',
					shouldDim && !isSelected && 'opacity-60'
				)}
				displayDelimiter={config.keyValueDisplayDelimiter}
				submitDelimiter={config.keyValueSubmitDelimiter}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<ul className="flex gap-1 flex-wrap">
				{plain.map((item) => renderParameter(item, 'badge'))}
			</ul>
			{preformatted.length ? (
				<ul className="flex flex-col gap-1">
					{preformatted.map((item) => renderParameter(item, 'pre'))}
				</ul>
			) : null}
		</div>
	);
}
