/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { config } from '@/bublik/config';
import { Badge, Separator, cn } from '@/shared/tailwind-ui';
import { joinKeyValue } from '@/shared/utils';

import {
	MatrixIteration,
	ParamClassification,
	combos,
	facetTuples
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
	/** Viewport offset of the content header's bottom edge when stuck. */
	top: number;
	/** Coverage summary shown next to the legend ("320 cells · 100% filled"). */
	caption?: string | null;
}

/** Height of a small-multiple title row, on one line of badges. */
const PANEL_TITLE_HEIGHT = 32;
/** Narrowest a small multiple gets: room for a few columns of tiles. */
const PANEL_MIN_WIDTH = 232;

/**
 * Width a small multiple needs for its table without scrolling, estimated
 * from the labels so every panel in the grid gets the same width up front.
 */
function panelWidth(
	rows: string[],
	cols: string[],
	values: ParamClassification['values']
): number {
	const textWidth = (chars: number) => chars * 6 + 12;
	const longest = (key: string) =>
		Math.max(...values[key].map((value) => value.length));
	// Each row-header column holds its values and, above them, "key ↓"; the
	// column keys ("key →") sit across all of them.
	const rowHeaders = rows.reduce(
		(sum, key) => sum + textWidth(Math.max(longest(key), key.length + 2)),
		0
	);
	const colLabels = textWidth(Math.max(...cols.map((key) => key.length + 2)));
	const lastCol = cols[cols.length - 1];
	const columns = combos(cols, values).length;
	const tile = Math.max(36, textWidth(longest(lastCol)));
	const gaps = 2 * (rows.length + columns + 1);
	// The card's padding and border around the table.
	const frame = 2 * 6 + 2;

	return Math.max(
		PANEL_MIN_WIDTH,
		Math.ceil(Math.max(rowHeaders, colLabels) + columns * tile + gaps + frame)
	);
}

/** The matrix itself: one full-width table, or one table per facet value. */
export function ResultMatrixBody(props: ResultMatrixBodyProps) {
	const {
		iterations,
		filtered,
		classification,
		state,
		facetFilter,
		selectedKey,
		onCellClick,
		top,
		caption
	} = props;
	const { values } = classification;
	const canRender = state.rows.length > 0 && state.cols.length > 0;
	const isTrellis = state.facetMode === 'trellis' && state.facets.length > 0;

	let matrix: ReactNode;
	if (!canRender) {
		matrix = (
			<div className="m-4 rounded-md border border-dashed border-border-primary px-4 py-6 text-[0.75rem] leading-[1.125rem] text-text-menu">
				Assign at least one parameter to Rows and one to Columns.
			</div>
		);
	} else if (isTrellis) {
		matrix = (
			// One card per facet value, all as wide as the widest needs. The
			// ground is a lighter grey than the one around the matrix card, so
			// the card and its panels read as one block.
			<div
				className="grid items-start gap-2.5 bg-bg-body/50 p-2"
				style={{
					gridTemplateColumns: `repeat(auto-fill, minmax(${panelWidth(
						state.rows,
						state.cols,
						values
					)}px, 1fr))`
				}}
			>
				{facetTuples(state.facets, values, iterations).map((ft) => {
					const facetKey = ft.join('¦');
					const inFacet = (it: MatrixIteration) =>
						state.facets.every((k, i) => it.params[k] === ft[i]);
					const visible = filtered.filter(inFacet);
					// Only this panel's iterations say what exists in it: nothing
					// filters a panel by the values of its neighbours.
					const panelIterations = iterations.filter(inFacet);
					const observed = panelIterations.length > 0;

					return (
						<div
							key={facetKey}
							className={cn(
								'flex min-w-0 flex-col overflow-hidden rounded-lg border border-border-primary bg-bg-primary',
								!observed && 'opacity-60'
							)}
						>
							{/* The panel's facet values as parameter badges, matching the
							    cell drawer header; they wrap rather than clip. */}
							<div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border-primary px-2 py-1.5">
								{state.facets.map((k, i) => (
									<Badge key={k} className="bg-badge-1">
										{joinKeyValue(k, ft[i], config.keyValueDisplayDelimiter)}
									</Badge>
								))}
								{observed ? null : (
									<span className="px-1 text-[0.6875rem] leading-4 text-text-menu">
										not observed
									</span>
								)}
							</div>
							{/* Padded as the design canvas draws it, so the tiles keep off
							    the card's edges. */}
							<div className="px-1.5 pb-1.5 pt-1">
								<MatrixTable
									iterations={panelIterations}
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
									top={top + PANEL_TITLE_HEIGHT}
									compact
								/>
							</div>
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
				top={top}
			/>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div
				className={cn(
					'min-w-0 max-w-full overflow-x-auto',
					// The single table's tiles keep off the card's edges.
					!isTrellis && 'p-2'
				)}
			>
				{matrix}
			</div>
			{/* Footer: coverage first, then the legend; in a narrow window the
			    items wrap onto a second row rather than scrolling out of sight. */}
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-primary px-4 py-2">
				{caption ? (
					<>
						<span className="whitespace-nowrap text-[0.6875rem] font-semibold uppercase tracking-wide leading-[0.875rem] text-text-primary">
							{caption}
						</span>
						<Separator orientation="vertical" className="h-4 shrink-0" />
					</>
				) : null}
				<MatrixLegend mode={state.mode} />
			</div>
		</div>
	);
}
