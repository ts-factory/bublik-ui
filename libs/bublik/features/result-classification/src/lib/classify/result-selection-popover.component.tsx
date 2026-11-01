/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo, useState } from 'react';

import { LoginRequired } from '@/bublik/features/auth';
import { useGetResultInfoQuery } from '@/services/bublik-api';
import {
	Badge,
	BadgeVariants,
	ButtonTw,
	Icon,
	SelectionPopover,
	SelectionPopoverBody,
	SelectionPopoverFloatingButton,
	SelectionPopoverFooter,
	SelectionPopoverList,
	SelectionPopoverTitle,
	Skeleton,
	Tooltip,
	cn,
	useSelectionPopoverOpenState
} from '@/shared/tailwind-ui';

import { ClassifyDrawer } from './classify-drawer.component';
import { useClassifyForm } from './classify-form.hooks';
import { useClassify } from './classify.hooks';
import { resultsInRuns } from './classify.utils';
import type { ResultSelection } from './result-selection.context';
import {
	BASELINE_TOGGLE,
	CLASSIFY_TARGETS_HINT,
	type RunResults,
	type SelectableResult,
	type SelectedResult
} from './result-selection.utils';
import { SelectListedResults } from './select-listed-results.component';

/** The same key on every page, so the popover stays open or shut across them. */
const OPEN_STATE_KEY = 'results-selection-popover-open';

const NO_RUNS: RunResults[] = [];

interface SelectedResultItemProps {
	result: SelectedResult;
	/** The selection spans runs: the item says which one it is of. */
	showRun: boolean;
	isReference: boolean;
	/** Makes this result the reference, or, while it is one, stops comparing. */
	onToggleReference: () => void;
	onRemove: () => void;
}

/**
 * One picked result in the list: its test, its id, its obtained result,
 * and whether it is the one the parameters are compared against, with a
 * toggle to make it so. Read back from the server, as the runs popover
 * reads its runs: the selection keeps ids only, so it survives a page
 * change.
 */
function SelectedResultItem({
	result,
	showRun,
	isReference,
	onToggleReference,
	onRemove
}: SelectedResultItemProps) {
	const { data, isLoading, isError } = useGetResultInfoQuery(result.resultId);
	const baseline = isReference ? BASELINE_TOGGLE.clear : BASELINE_TOGGLE.set;

	if (isLoading) return <Skeleton className="h-[54px] rounded" />;

	const obtained = data?.obtained_result.result_type;
	const failed = data?.has_error ?? result.classifiable;

	return (
		<div
			className="flex rounded"
			data-testid="selected-result-item"
			data-result-id={result.resultId}
		>
			<Tooltip
				content={
					isError
						? 'Could not read this result'
						: failed
						? 'Unexpected result'
						: 'Expected result'
				}
				disableHoverableContent
			>
				<div
					className={cn(
						'grid w-1.5 shrink-0 rounded-l',
						isError ? 'bg-border-primary' : failed ? 'bg-bg-error' : 'bg-bg-ok'
					)}
				/>
			</Tooltip>
			<div className="flex items-center justify-between flex-grow gap-2 py-2 pl-2 pr-1.5 border-r rounded-r border-y min-w-0">
				<div className="flex flex-col gap-1 min-w-0">
					<div className="flex items-center gap-1.5 min-w-0">
						{obtained ? (
							<Badge
								variant={
									failed ? BadgeVariants.Unexpected : BadgeVariants.Expected
								}
								className="text-[0.625rem] leading-[0.875rem] shrink-0"
							>
								{obtained}
							</Badge>
						) : null}
						<span
							className="truncate text-[0.6875rem] font-medium leading-[0.875rem]"
							title={data?.path ?? undefined}
						>
							{data?.name ?? `Result ${result.resultId}`}
						</span>
					</div>
					{/* One line tall whatever it holds, so the Baseline badge does
					    not grow the row when it shows. */}
					<div className="flex h-3.5 items-center gap-1.5 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
						<span>#{result.resultId}</span>
						{showRun ? (
							<span data-testid="selected-result-run">Run {result.runId}</span>
						) : null}
						{isReference ? (
							<Badge
								variant={BadgeVariants.Primary}
								className="py-0 text-[0.625rem] leading-3"
							>
								Baseline
							</Badge>
						) : null}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<Tooltip content={baseline.hint} disableHoverableContent>
						<button
							aria-label={baseline.label}
							aria-pressed={isReference}
							className={cn(
								'grid place-items-center rounded transition-colors',
								isReference
									? 'bg-primary text-white'
									: 'text-text-menu hover:bg-primary-wash hover:text-primary'
							)}
							onClick={onToggleReference}
							data-testid="selected-result-reference"
							data-state={isReference ? 'on' : 'off'}
						>
							<Icon name="SwapArrows" size={20} className="rotate-90" />
						</button>
					</Tooltip>
					<Tooltip content="Remove from selection" disableHoverableContent>
						<button
							aria-label="Remove from selection"
							className="grid shrink-0 transition-colors rounded place-items-center text-text-unexpected hover:bg-bg-fillError/60"
							onClick={onRemove}
							data-testid="selected-result-remove"
						>
							<Icon name="CrossSimple" size={20} />
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}

export interface ResultSelectionPopoverProps {
	selection: ResultSelection;
	/** See `ResultSelectionProviderProps.raised`. */
	raised?: boolean;
	/** See `ResultSelectionProviderProps.listed`. */
	listed?: readonly SelectableResult[];
}

/**
 * The popover that follows a selection of results, laid out as the runs
 * page's selection popover: a floating pill with the count that opens a
 * list of the picked results, and a footer with what can be done with them.
 * Classify stamps them all under one issue; Select All, where the page
 * lists its rows, picks them; a row's own toggle makes it the
 * reference the parameter columns are read against; Reset drops both.
 */
export function ResultSelectionPopover({
	selection,
	raised = false,
	listed
}: ResultSelectionPopoverProps) {
	const { count, targets, referenceResultId, setReference, remove, clear } =
		selection;
	const [drawerOpen, setDrawerOpen] = useState(false);
	const { open, onOpenChange, resetOpenState } =
		useSelectionPopoverOpenState(OPEN_STATE_KEY);
	const runs = useMemo(() => (targets.ok ? targets.runs : NO_RUNS), [targets]);
	const projectId = targets.ok ? targets.projectId : undefined;
	const { submit, canClassify } = useClassify(runs, projectId);
	const form = useClassifyForm();

	const results = Array.from(selection.selected.values());
	const runCount = new Set(results.map((result) => result.runId)).size;
	const toClassify = targets.ok ? targets.resultIds.length : 0;

	const classifyHint = !targets.ok
		? CLASSIFY_TARGETS_HINT[targets.reason]
		: !canClassify
		? 'Select a project first'
		: `Classify ${resultsInRuns(toClassify, runs.length)} under one issue`;

	function handleReset() {
		resetOpenState();
		clear();
	}

	function handleRemove(resultId: number) {
		if (count === 1) resetOpenState();
		remove(resultId);
	}

	return (
		<>
			{count > 0 ? (
				<SelectionPopover
					open={open}
					onOpenChange={onOpenChange}
					layout="size"
					raised={raised}
				>
					<SelectionPopoverFloatingButton
						label={`${resultsInRuns(count, runCount)} selected`}
						icon="ExpandSelection"
						data-testid="results-selection-toggle"
						data-count={count}
						data-run-count={runCount}
					/>
					<SelectionPopoverBody data-testid="results-selection-popover">
						<div className="flex items-center justify-between gap-2">
							<SelectionPopoverTitle className="mb-0">
								Selected Results
							</SelectionPopoverTitle>
							{listed ? (
								<SelectListedResults selection={selection} listed={listed} />
							) : null}
						</div>
						{/* A bulk pick can run to hundreds of rows: the list scrolls
						    inside half the viewport, under a title and over buttons
						    that stay put. */}
						<SelectionPopoverList className="mb-2 max-h-[50vh] overflow-y-auto styled-scrollbar pr-1">
							{results.map((result) => (
								<li key={result.resultId}>
									<SelectedResultItem
										result={result}
										showRun={runCount > 1}
										isReference={referenceResultId === result.resultId}
										onToggleReference={() =>
											setReference(
												referenceResultId === result.resultId
													? null
													: result.resultId
											)
										}
										onRemove={() => handleRemove(result.resultId)}
									/>
								</li>
							))}
						</SelectionPopoverList>
					</SelectionPopoverBody>
					<SelectionPopoverFooter>
						<div className="grid grid-cols-2 gap-2">
							{/* Half and half, whatever the labels' widths. Signed out,
							    the inert wrapper has to stretch too, or the button shrinks
							    to its label. */}
							<LoginRequired
								message="Log in to classify results"
								className="w-full [&>span]:w-full"
							>
								<Tooltip content={classifyHint}>
									<ButtonTw
										variant="primary"
										rounded="lg"
										size="sm/2"
										className="w-full justify-center"
										disabled={!targets.ok || !canClassify}
										onClick={() => setDrawerOpen(true)}
										data-testid="bulk-classify-trigger"
									>
										<Icon
											name="TriangleExclamationMark"
											size={20}
											className="mr-2"
										/>
										<span>Classify{targets.ok ? ` ${toClassify}` : ''}</span>
									</ButtonTw>
								</Tooltip>
							</LoginRequired>
							<ButtonTw
								variant="outline"
								rounded="lg"
								size="sm/2"
								className="w-full justify-center"
								onClick={handleReset}
								data-testid="bulk-classify-clear"
							>
								Reset
							</ButtonTw>
						</div>
					</SelectionPopoverFooter>
				</SelectionPopover>
			) : null}

			<ClassifyDrawer
				open={drawerOpen}
				onOpenChange={(next) => {
					setDrawerOpen(next);

					if (!next) form.reset();
				}}
				form={form}
				runs={runs}
				projectId={projectId}
				submit={async (input) => {
					const response = await submit(input);

					// Stamped: the rows will redraw with their stamps, and there is
					// nothing left to do with the selection.
					resetOpenState();
					clear();

					return response;
				}}
			/>
		</>
	);
}
