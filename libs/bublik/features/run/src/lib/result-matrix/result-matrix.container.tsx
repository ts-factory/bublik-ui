/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { config } from '@/bublik/config';
import { useIsSticky } from '@/shared/hooks';
import { joinKeyValue } from '@/shared/utils';
import { RunDataResults } from '@/shared/types';
import {
	ButtonTw,
	Checkbox,
	Icon,
	SegmentedTabs,
	Separator,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import {
	HEADER_HEIGHT,
	ResultTableBar,
	TOOLBAR_HEIGHT,
	useDataTableFilters
} from '../result-table/result-table.component';
import {
	MatrixIteration,
	MatrixSuggestion,
	ParamClassification,
	comboCount,
	matchTuple,
	presenceSet,
	suggestLayouts
} from './matrix-analysis';
import { MatrixCellDrawer } from './matrix-cell-drawer';
import { MatrixFacetFilters } from './matrix-facet-filters';
import { MatrixRail, RAIL_HEADER_HEIGHT } from './matrix-rail';
import { MatrixCellRef, cellKey } from './matrix-table';
import { ResultMatrixBody } from './result-matrix.component';
import {
	DEFAULT_CELL_MODE,
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
	/** The filter bar's switch and History link, as the list draws them. */
	toolbarActions?: ReactNode;
	toolbarTrailing?: ReactNode;
	toolbarClassName?: string;
}

interface CellSelection {
	rowTuple: string[];
	colTuple: string[];
	/** Joined facet values when the cell belongs to a small multiple. */
	facetKey?: string;
}

/** Uppercase control labels; the same size as the rail's section titles. */
const LABEL =
	'text-[0.625rem] font-semibold leading-[0.875rem] uppercase tracking-wide text-text-menu';

/**
 * The border-box height of the element the returned callback ref is attached
 * to, kept current as it wraps; 0 while nothing is attached.
 */
function useElementHeight<T extends HTMLElement>(): [
	(element: T | null) => void,
	number
] {
	const [element, setElement] = useState<T | null>(null);
	const [height, setHeight] = useState(0);

	useEffect(() => {
		if (!element) {
			setHeight(0);
			return;
		}
		const observer = new ResizeObserver(() =>
			setHeight(element.getBoundingClientRect().height)
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [element]);

	return [setElement, height];
}

export function ResultMatrixContainer(props: ResultMatrixContainerProps) {
	const {
		rowId,
		data,
		iterations,
		classification,
		height,
		showLinkToRun,
		path,
		toolbarActions,
		toolbarTrailing,
		toolbarClassName
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
	const filtered = useMemo(() => {
		const kept = new Set(filters.filteredData);

		return iterations.filter((it) => kept.has(it.source));
	}, [iterations, filters.filteredData]);

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

	// The axes themselves are already spelled out by the table's axis labels
	// and the facet chips / panel titles, so only the coverage is summarised.
	const summary = useMemo(() => {
		const axes = [...state.rows, ...state.cols, ...state.facets];
		if (!state.rows.length || !state.cols.length) return null;
		const cells = comboCount(axes, classification.values);
		const present = presenceSet(iterations, axes).size;
		const filled = cells ? Math.round((present / cells) * 100) : 0;

		return `${cells} cells · ${filled}% filled`;
	}, [state.rows, state.cols, state.facets, classification.values, iterations]);

	const stickyTop = height + HEADER_HEIGHT;
	const railTop = stickyTop + TOOLBAR_HEIGHT;

	// The facet row pins under the header; the matrix's own header pins under
	// both, so it is pushed down by however many lines the facets wrap onto.
	const [facetRowRef, facetRowHeight] = useElementHeight<HTMLDivElement>();
	const facetRowTop = railTop + RAIL_HEADER_HEIGHT;

	const marginsId = `matrix-margins-${rowId}`;
	const headerRef = useRef<HTMLDivElement>(null);
	const { isSticky: isHeaderStuck } = useIsSticky(headerRef, {
		offset: -(railTop + 1)
	});

	return (
		<div className="flex flex-col">
			<ResultTableBar
				filters={filters}
				top={stickyTop}
				actions={toolbarActions}
				trailing={toolbarTrailing}
				className={toolbarClassName}
			/>
			{/* Two cards on a grey ground: the rail, and the matrix filling the
			    rest. The block is capped and centred on wide screens; its width
			    never follows the content, so switching modes moves nothing. */}
			<div className="bg-bg-body p-2">
				<div className="mx-auto flex max-w-screen-2xl items-start gap-2">
					{/* Stretched to the row's height so the rail inside stays sticky. */}
					<div className="shrink-0 self-stretch">
						<MatrixRail
							classification={classification}
							suggestions={suggestions}
							state={state}
							onRoleChange={handleRoleChange}
							top={railTop}
							onApplySuggestion={handleApplySuggestion}
							className="rounded-lg bg-bg-primary"
						/>
					</div>
					{/* No overflow clipping here: it would pin the sticky header to the
				    card instead of the page. */}
					<div className="flex min-w-0 flex-1 flex-col rounded-lg bg-bg-primary">
						{/* Sticky under the filter row, like the rail. Fixed height so it
					    lines up with the rail header; controls never wrap, overflow
					    scrolls sideways. */}
						<div
							ref={headerRef}
							className={cn(
								// Under the filter bar (z-10): when the card's end pushes the
								// header up, it slides beneath the bar instead of over it. Over
								// the facet row (z-[4]), which slides beneath it the same way.
								'sticky z-[6] flex shrink-0 items-center gap-x-3 border-b border-border-primary bg-bg-primary px-4',
								// Stuck under the filter row, it meets it square.
								!isHeaderStuck && 'rounded-t-lg'
							)}
							style={{ top: railTop, height: RAIL_HEADER_HEIGHT }}
						>
							<div className="styled-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap [&>*]:shrink-0">
								<span className={LABEL}>Cell</span>
								<SegmentedTabs<MatrixCellMode>
									aria-label="Cell mode"
									value={state.mode}
									onChange={(mode) =>
										change('mode', {
											mode: mode === DEFAULT_CELL_MODE ? undefined : mode
										})
									}
									items={[
										{
											value: 'result',
											label: 'Result',
											tooltip: 'Colour cells by expected / unexpected result'
										},
										{
											value: 'coverage',
											label: 'Coverage',
											tooltip: 'Colour cells by how many iterations they hold'
										}
									]}
								/>
								{state.facets.length ? (
									<>
										<Separator orientation="vertical" className="mx-1 h-5" />
										<span className={LABEL}>Facets</span>
										<SegmentedTabs<MatrixFacetMode>
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
								<Separator orientation="vertical" className="mx-1 h-5" />
								<Tooltip content="Reset the matrix layout to the default">
									<ButtonTw
										variant="secondary"
										size="xss"
										onClick={handleReset}
									>
										<Icon
											name="Refresh"
											size={18}
											className="mr-1.5"
											style={{ transform: 'scaleX(-1)' }}
										/>
										Reset Layout
									</ButtonTw>
								</Tooltip>
							</div>
							<div className="ml-auto flex shrink-0 items-center gap-2">
								<Checkbox
									id={marginsId}
									label="Margins"
									checked={state.margins}
									onCheckedChange={(checked) =>
										change('margins', {
											margins: checked === true || undefined
										})
									}
								/>
							</div>
						</div>
						{/* The facet values on a row of their own under the header, where
						    any number of them wrap rather than scroll the fixed-height
						    header sideways. Pinned under the header, so the values in
						    force stay in sight beside the cells they pick. */}
						{state.facetMode === 'filter' && state.facets.length ? (
							<div
								ref={facetRowRef}
								className="sticky z-[4] border-b border-border-primary bg-bg-primary px-4 py-1.5"
								style={{ top: facetRowTop }}
							>
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
							</div>
						) : null}
						<ResultMatrixBody
							iterations={iterations}
							filtered={filtered}
							classification={classification}
							state={state}
							facetFilter={facetFilter}
							selectedKey={selectedKey}
							onCellClick={handleCellClick}
							top={facetRowTop + facetRowHeight}
							caption={summary}
						/>
					</div>
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
									.map((k, i) =>
										joinKeyValue(
											k,
											selection.facetKey?.split('¦')[i] ?? '',
											config.keyValueDisplayDelimiter
										)
									)
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
