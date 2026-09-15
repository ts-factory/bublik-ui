/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import {
	MatrixIteration,
	ParamClassification,
	combos
} from './matrix-analysis';
import { MatrixLegend } from './matrix-legend';
import { MatrixCellRef, MatrixTable } from './matrix-table';
import { MatrixState } from './result-view.hooks';

export interface ResultMatrixBodyProps {
	iterations: MatrixIteration[];
	/** Iterations after the result-table filters (before facets). */
	filtered: MatrixIteration[];
	classification: ParamClassification;
	state: MatrixState;
	facetFilter: (it: MatrixIteration) => boolean;
	selectedKey?: string;
	onCellClick?: (cell: MatrixCellRef, facetKey?: string) => void;
	/** Rendered to the right of the matrix (e.g. the selected-cell panel). */
	aside?: ReactNode;
}

/** The matrix itself (single or small multiples), the legend and an optional aside. */
export function ResultMatrixBody(props: ResultMatrixBodyProps) {
	const {
		iterations,
		filtered,
		classification,
		state,
		facetFilter,
		selectedKey,
		onCellClick,
		aside
	} = props;
	const { values } = classification;
	const canRender = state.rows.length > 0 && state.cols.length > 0;
	const isTrellis = state.facetMode === 'trellis' && state.facets.length > 0;

	let matrix: ReactNode;
	if (!canRender) {
		matrix = (
			<div className="rounded-md border border-dashed border-border-primary px-4 py-6 text-[0.75rem] leading-[1.125rem] text-text-menu">
				Assign at least one parameter to Rows and one to Columns.
			</div>
		);
	} else if (isTrellis) {
		matrix = (
			<div className="flex flex-wrap gap-4">
				{combos(state.facets, values).map((ft) => {
					const facetKey = ft.join('¦');
					const visible = filtered.filter((it) =>
						state.facets.every((k, i) => it.params[k] === ft[i])
					);

					return (
						<div key={facetKey} className="flex flex-col gap-1.5">
							<div className="text-[0.6875rem] font-semibold leading-[0.875rem] text-text-menu">
								{state.facets.map((k, i) => `${k} = ${ft[i]}`).join(' · ')}
							</div>
							<MatrixTable
								iterations={iterations}
								visible={visible}
								rowKeys={state.rows}
								colKeys={state.cols}
								values={values}
								mode={state.mode}
								margins={state.margins}
								selectedKey={
									selectedKey?.startsWith(`${facetKey}|`)
										? selectedKey.slice(facetKey.length + 1)
										: undefined
								}
								onCellClick={
									onCellClick
										? (cell) => onCellClick(cell, facetKey)
										: undefined
								}
							/>
						</div>
					);
				})}
			</div>
		);
	} else {
		matrix = (
			<MatrixTable
				iterations={iterations}
				visible={filtered.filter(facetFilter)}
				rowKeys={state.rows}
				colKeys={state.cols}
				values={values}
				mode={state.mode}
				margins={state.margins}
				selectedKey={selectedKey}
				onCellClick={onCellClick}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-start gap-4">
				<div className="min-w-0 max-w-full overflow-x-auto">{matrix}</div>
				{aside}
			</div>
			<MatrixLegend mode={state.mode} />
		</div>
	);
}
