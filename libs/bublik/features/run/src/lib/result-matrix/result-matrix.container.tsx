/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode, useCallback, useMemo } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { RunDataResults } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import { ResultTableFilters } from '../result-table/result-table-filters.component';
import { useDataTableFilters } from '../result-table/result-table.component';
import { ResultViewBar } from '../result-table/result-view-toggle';
import {
	MatrixIteration,
	MatrixSuggestion,
	ParamClassification,
	combos,
	presenceSet,
	suggestLayouts,
	toIterations
} from './matrix-analysis';
import { MatrixFacetFilters } from './matrix-facet-filters';
import { MatrixHeaderControls } from './matrix-header-controls';
import { MatrixRail } from './matrix-rail';
import { MatrixToolbar } from './matrix-toolbar';
import { ResultMatrixBody } from './result-matrix.component';
import {
	FACET_ALL,
	MatrixConfigLayout,
	MatrixFacetMode,
	MatrixRole,
	ResultViewState,
	assignRole,
	resolveMatrixState,
	swapAxes,
	useResultView
} from './result-view.hooks';

export interface ResultMatrixContainerProps {
	rowId: string;
	testName: string;
	data: RunDataResults[];
	iterations: MatrixIteration[];
	classification: ParamClassification;
	/** The List / Matrix switcher, rendered on the left of the view bar. */
	viewToggle: ReactNode;
}

export function ResultMatrixContainer(props: ResultMatrixContainerProps) {
	const { rowId, testName, data, iterations, classification, viewToggle } =
		props;

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

	const handleLayoutChange = useCallback(
		(layout: MatrixConfigLayout) => {
			trackEvent(analyticsEventNames.resultMatrixLayoutChange, { layout });
			patch({ layout: layout === 'rail' ? undefined : layout });
		},
		[patch]
	);

	const summary = useMemo(() => {
		const axes = [...state.rows, ...state.cols];
		if (!axes.length) return null;
		const cells = combos(axes, classification.values).length;
		const present = presenceSet(iterations, axes).size;
		const fill = cells ? Math.round((present / cells) * 100) : 0;

		return `${state.rows.join(' ▸ ')} × ${state.cols.join(
			' ▸ '
		)} · ${cells} cells · ${fill}% filled`;
	}, [state.rows, state.cols, classification.values, iterations]);

	const configProps = {
		classification,
		suggestions,
		state,
		onRoleChange: handleRoleChange,
		onFacetModeChange: (facetMode: MatrixFacetMode) =>
			change('facetMode', {
				facetMode: facetMode === 'filter' ? undefined : facetMode
			}),
		onApplySuggestion: handleApplySuggestion,
		onReset: handleReset
	};

	return (
		<div className="flex flex-col">
			<ResultViewBar
				left={
					<>
						{viewToggle}
						<span className="truncate text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary">
							{testName}
						</span>
						{summary ? (
							<span className="text-[0.75rem] leading-[1.125rem] text-text-menu">
								{summary}
							</span>
						) : null}
					</>
				}
				right={
					<MatrixHeaderControls
						rowId={rowId}
						mode={state.mode}
						onModeChange={(mode) =>
							change('mode', { mode: mode === 'coverage' ? undefined : mode })
						}
						margins={state.margins}
						onMarginsChange={(margins) =>
							change('margins', { margins: margins || undefined })
						}
						layout={state.layout}
						onLayoutChange={handleLayoutChange}
					/>
				}
			/>
			{state.layout === 'toolbar' ? (
				<MatrixToolbar
					{...configProps}
					onSwapAxes={() => change('swap', swapAxes(state))}
				/>
			) : null}
			<div className="border-b border-border-primary px-4 py-1.5">
				<ResultTableFilters filters={filters} className="flex-wrap" />
			</div>
			<div className="flex">
				{state.layout === 'rail' ? <MatrixRail {...configProps} /> : null}
				<div className={cn('flex min-w-0 flex-1 flex-col gap-3 p-4')}>
					{state.facetMode === 'filter' ? (
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
					) : null}
					<ResultMatrixBody
						iterations={iterations}
						filtered={filtered}
						classification={classification}
						state={state}
						facetFilter={facetFilter}
					/>
				</div>
			</div>
		</div>
	);
}
