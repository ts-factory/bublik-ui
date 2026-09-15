/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { config } from '@/bublik/config';
import { Separator, cn } from '@/shared/tailwind-ui';
import { joinKeyValue } from '@/shared/utils';

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
	/** Stretch the table(s) to the available width. */
	fill: boolean;
	/** Viewport offset of the content header's bottom edge when stuck. */
	top: number;
	/** Coverage summary shown next to the legend ("320 cells · 100% filled"). */
	caption?: string | null;
}

/** Height of a small-multiple title row. */
const PANEL_TITLE_HEIGHT = 36;

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
		fill,
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
			<div className="flex flex-wrap">
				{combos(state.facets, values).map((ft) => {
					const facetKey = ft.join('¦');
					const visible = filtered.filter((it) =>
						state.facets.every((k, i) => it.params[k] === ft[i])
					);

					return (
						<div
							key={facetKey}
							className={cn(
								'flex min-w-0 flex-col border-b border-r border-border-primary',
								// Wrap at the natural width, then share the leftover space.
								fill && 'min-w-max flex-1'
							)}
						>
							<div className="flex h-9 shrink-0 items-center border-b border-border-primary px-4 text-[0.6875rem] font-semibold leading-[0.875rem] text-text-primary">
								{state.facets
									.map((k, i) =>
										joinKeyValue(k, ft[i], config.keyValueDisplayDelimiter)
									)
									.join(' · ')}
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
								fill={fill}
								top={top + PANEL_TITLE_HEIGHT}
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
				fill={fill}
				fillHeight
				top={top}
			/>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div
				className={cn(
					'min-w-0 max-w-full overflow-x-auto',
					fill && !isTrellis && 'flex min-h-0 flex-1 flex-col'
				)}
			>
				{matrix}
			</div>
			{/* Footer: coverage first, then the legend. A single table may be
			    shorter than the rail, so the footer is pushed to the bottom of the
			    content column to stay in one place. */}
			<div
				className={cn(
					'flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-primary px-4 py-2',
					!isTrellis && 'mt-auto'
				)}
			>
				{caption ? (
					<>
						<span className="whitespace-nowrap text-[0.6875rem] font-semibold uppercase tracking-wide leading-[0.875rem] text-text-primary">
							{caption}
						</span>
						<Separator orientation="vertical" className="h-4" />
					</>
				) : null}
				<MatrixLegend mode={state.mode} />
			</div>
		</div>
	);
}
