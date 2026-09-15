/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { RunDataResults } from '@/shared/types';
import {
	ButtonTw,
	Checkbox,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';

import { JoinedToggleGroup } from '../joined-toggle-group';
import { ResultTableFilters } from '../result-table/result-table-filters.component';
import {
	HEADER_HEIGHT,
	TOOLBAR_HEIGHT,
	useDataTableFilters
} from '../result-table/result-table.component';
import {
	MatrixIteration,
	MatrixSuggestion,
	ParamClassification,
	combos,
	matchTuple,
	presenceSet,
	suggestLayouts,
	toIterations
} from './matrix-analysis';
import { MatrixCellDrawer } from './matrix-cell-drawer';
import { MatrixFacetFilters } from './matrix-facet-filters';
import { MatrixRail } from './matrix-rail';
import { MatrixCellRef, cellKey } from './matrix-table';
import { ResultMatrixBody } from './result-matrix.component';
import {
	FACET_ALL,
	MatrixCellMode,
	MatrixFacetMode,
	MatrixRole,
	ResultViewState,
	assignRole,
	resolveMatrixState,
	useResultView
} from './result-view.hooks';

export interface ResultMatrixContainerProps {
	rowId: string;
	data: RunDataResults[];
	iterations: MatrixIteration[];
	classification: ParamClassification;
	/** Top offset of the expanded run-table row, for the sticky filter row. */
	height: number;
	showLinkToRun?: boolean;
	path?: string;
}

interface CellSelection {
	rowTuple: string[];
	colTuple: string[];
	/** Joined facet values when the cell belongs to a small multiple. */
	facetKey?: string;
}

const LABEL =
	'text-[0.6875rem] font-semibold leading-[0.875rem] uppercase tracking-wide text-text-menu';

export function ResultMatrixContainer(props: ResultMatrixContainerProps) {
	const {
		rowId,
		data,
		iterations,
		classification,
		height,
		showLinkToRun,
		path
	} = props;

	const { state: viewState, patch, resetMatrix } = useResultView(rowId);
	const suggestions = useMemo(
		() => suggestLayouts(iterations, classification),
		[iterations, classification]
	);
	const state = useMemo(
		() => resolveMatrixState(viewState, classification, suggestions),
		[viewState, classification, suggestions]
	);

	const filters = useDataTableFilters(rowId, data);
	const filtered = useMemo(
		() => toIterations(filters.filteredData),
		[filters.filteredData]
	);

	const facetFilter = useCallback(
		(it: MatrixIteration) =>
			state.facets.every(
				(k) =>
					state.facetSel[k] === FACET_ALL || it.params[k] === state.facetSel[k]
			),
		[state.facets, state.facetSel]
	);

	// Selection is transient: it is not part of the URL and is cleared when
	// the axes or the facet mode change.
	const [selection, setSelection] = useState<CellSelection | null>(null);
	const axesKey = `${state.rows.join('¦')}|${state.cols.join('¦')}|${
		state.facetMode
	}`;
	useEffect(() => setSelection(null), [axesKey]);

	const handleCellClick = useCallback(
		(cell: MatrixCellRef, facetKey?: string) => {
			trackEvent(analyticsEventNames.resultMatrixCellSelect, {
				iterations: cell.iterations.length
			});
			setSelection({
				rowTuple: cell.rowTuple,
				colTuple: cell.colTuple,
				facetKey
			});
		},
		[]
	);

	const selectedKey = selection
		? `${
				selection.facetKey !== undefined ? `${selection.facetKey}|` : ''
		  }${cellKey(selection.rowTuple, selection.colTuple)}`
		: undefined;

	// Re-derived on every render so the drawer follows filter changes.
	const selectedIterations = useMemo(() => {
		if (!selection) return [];
		const facetValues = selection.facetKey?.split('¦');
		const inFacet = (it: MatrixIteration) =>
			facetValues
				? state.facets.every((k, i) => it.params[k] === facetValues[i])
				: facetFilter(it);

		return filtered.filter(
			(it) =>
				inFacet(it) &&
				matchTuple(it, state.rows, selection.rowTuple) &&
				matchTuple(it, state.cols, selection.colTuple)
		);
	}, [selection, filtered, state.facets, state.rows, state.cols, facetFilter]);

	const change = useCallback(
		(field: string, changes: ResultViewState) => {
			trackEvent(analyticsEventNames.resultMatrixConfigChange, { field });
			patch(changes);
		},
		[patch]
	);

	const handleRoleChange = useCallback(
		(param: string, role: MatrixRole) =>
			change('role', assignRole(state, param, role)),
		[change, state]
	);

	const handleApplySuggestion = useCallback(
		(s: MatrixSuggestion) =>
			change('suggestion', {
				rows: [...s.rows],
				cols: [...s.cols],
				facets: [...s.facets],
				facetSel: undefined
			}),
		[change]
	);

	const handleReset = useCallback(() => {
		trackEvent(analyticsEventNames.resultMatrixConfigChange, {
			field: 'reset'
		});
		resetMatrix();
	}, [resetMatrix]);

	const summary = useMemo(() => {
		const axes = [...state.rows, ...state.cols, ...state.facets];
		if (!state.rows.length || !state.cols.length) return null;
		const cells = combos(axes, classification.values).length;
		const present = presenceSet(iterations, axes).size;
		const filled = cells ? Math.round((present / cells) * 100) : 0;
		const layout = `${state.rows.join(' ▸ ')} × ${state.cols.join(' ▸ ')}${
			state.facets.length ? ` ▸ ${state.facets.join(' ▸ ')}` : ''
		}`;

		return `${layout} · ${cells} cells · ${filled}% filled`;
	}, [state.rows, state.cols, state.facets, classification.values, iterations]);

	const stickyTop = height + HEADER_HEIGHT;
	const railTop = stickyTop + TOOLBAR_HEIGHT;

	const marginsId = `matrix-margins-${rowId}`;

	return (
		<div className="flex flex-col">
			<div
				className="sticky z-10 flex h-9 items-center border-b border-border-primary bg-white px-4 shadow-sticky"
				style={{ top: stickyTop }}
			>
				<ResultTableFilters filters={filters} />
			</div>
			<div className="flex">
				{/* The wrapper carries the border so it spans the full row height
				    while the rail itself stays sticky. */}
				<div className="shrink-0 border-r border-border-primary">
					<MatrixRail
						classification={classification}
						suggestions={suggestions}
						state={state}
						onRoleChange={handleRoleChange}
						top={railTop}
						onApplySuggestion={handleApplySuggestion}
						onReset={handleReset}
					/>
				</div>
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border-primary px-4 py-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className={LABEL}>Cell</span>
							<JoinedToggleGroup<MatrixCellMode>
								aria-label="Cell mode"
								value={state.mode}
								onChange={(mode) =>
									change('mode', {
										mode: mode === 'coverage' ? undefined : mode
									})
								}
								items={[
									{
										value: 'coverage',
										label: 'Coverage',
										tooltip: 'Colour cells by how many iterations they hold'
									},
									{
										value: 'result',
										label: 'Result',
										tooltip: 'Colour cells by expected / unexpected result'
									}
								]}
							/>
							<Checkbox
								id={marginsId}
								label="Margins"
								checked={state.margins}
								onCheckedChange={(checked) =>
									change('margins', { margins: checked === true || undefined })
								}
								className="ml-1"
							/>
							{state.facets.length ? (
								<>
									<Separator orientation="vertical" className="mx-1 h-5" />
									<span className={LABEL}>Facets</span>
									<JoinedToggleGroup<MatrixFacetMode>
										aria-label="Facet mode"
										value={state.facetMode}
										onChange={(facetMode) =>
											change('facetMode', {
												facetMode:
													facetMode === 'filter' ? undefined : facetMode
											})
										}
										items={[
											{
												value: 'filter',
												label: 'Filter',
												tooltip: 'Pick one value'
											},
											{
												value: 'trellis',
												label: 'Split',
												tooltip: 'One matrix per facet value'
											}
										]}
									/>
								</>
							) : null}
							{state.facetMode === 'filter' && state.facets.length ? (
								<>
									<Separator orientation="vertical" className="mx-1 h-5" />
									<MatrixFacetFilters
										facets={state.facets}
										facetSel={state.facetSel}
										values={classification.values}
										onChange={(param, value) =>
											change('facet', {
												facetSel: { ...state.facetSel, [param]: value }
											})
										}
									/>
								</>
							) : null}
						</div>
						<div className="flex items-center gap-2">
							<Tooltip
								content={
									state.fill
										? 'Size the table to its content'
										: 'Stretch the table to the available width'
								}
							>
								<ButtonTw
									variant="secondary"
									size="xss"
									state={state.fill ? 'active' : 'default'}
									aria-pressed={state.fill}
									onClick={() =>
										change('fill', { fill: state.fill ? undefined : true })
									}
								>
									<Icon name="SwapArrows" size={18} className="mr-1.5" />
									Fill
								</ButtonTw>
							</Tooltip>
							{summary ? (
								<>
									<Separator orientation="vertical" className="mx-1 h-5" />
									<span className="text-[0.75rem] leading-[1.125rem] text-text-menu">
										{summary}
									</span>
								</>
							) : null}
						</div>
					</div>
					<ResultMatrixBody
						iterations={iterations}
						filtered={filtered}
						classification={classification}
						state={state}
						facetFilter={facetFilter}
						selectedKey={selectedKey}
						onCellClick={handleCellClick}
						fill={state.fill}
					/>
				</div>
			</div>
			{selection ? (
				<MatrixCellDrawer
					open
					onOpenChange={(open) => {
						if (!open) setSelection(null);
					}}
					rowKeys={state.rows}
					colKeys={state.cols}
					rowTuple={selection.rowTuple}
					colTuple={selection.colTuple}
					facetLabel={
						selection.facetKey !== undefined
							? state.facets
									.map((k, i) => `${k} = ${selection.facetKey?.split('¦')[i]}`)
									.join(' · ')
							: undefined
					}
					iterations={selectedIterations}
					showLinkToRun={showLinkToRun}
					path={path}
				/>
			) : null}
		</div>
	);
}
