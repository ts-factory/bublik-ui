/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode, useState } from 'react';

import { cn } from '@/shared/tailwind-ui';

import {
	MatrixIteration,
	ParamClassification,
	combos,
	matchTuple,
	presenceSet,
	summarizeCell
} from './matrix-analysis';
import { MatrixCellMode } from './result-view.hooks';

export interface MatrixCellRef {
	rowTuple: string[];
	colTuple: string[];
	iterations: MatrixIteration[];
}

export interface MatrixTableProps {
	/** Every iteration of the test (defines which combos exist at all). */
	iterations: MatrixIteration[];
	/** Iterations after filters and facets (what the cells count). */
	visible: MatrixIteration[];
	rowKeys: string[];
	colKeys: string[];
	values: ParamClassification['values'];
	mode: MatrixCellMode;
	margins: boolean;
	/** `cellKey(rowTuple, colTuple)` of the highlighted cell, if any. */
	selectedKey?: string;
	onCellClick?: (cell: MatrixCellRef) => void;
	/** Stretch to the container width instead of sizing to content. */
	fill?: boolean;
	/** With `fill`, also stretch to the height of the flex parent. */
	fillHeight?: boolean;
	/** Viewport offset of the sticky stack above the table, in px. */
	top: number;
}

/** Room kept under the table for the legend row and the page padding. */
const VIEWPORT_BOTTOM_RESERVE = 40;

export const TUPLE_SEPARATOR = '¦';

export function cellKey(rowTuple: string[], colTuple: string[]): string {
	return [...rowTuple, ...colTuple].join(TUPLE_SEPARATOR);
}

/** Blue ramp: the app uses primary for neutral counts (totals, "run"). */
export const COVERAGE_CLASSES = [
	'bg-primary/10 text-text-primary',
	'bg-primary/25 text-text-primary',
	'bg-primary/45 text-text-primary',
	'bg-primary text-white'
];

export const RESULT_CLASSES = {
	expected: 'bg-badge-3 text-text-expected',
	unexpected: 'bg-bg-fillError text-text-unexpected'
} as const;

/** Hatched background for combinations never observed in any iteration. */
export const NOT_OBSERVED_STYLE = {
	backgroundImage:
		'repeating-linear-gradient(45deg, transparent 0 4px, hsl(var(--colors-border-primary)) 4px 5px)'
} as const;

const HEADER_CELL =
	'bg-primary-wash px-2 py-1 h-9 border-b border-r border-border-primary text-[0.6875rem] font-semibold leading-[0.875rem] whitespace-nowrap';
const BODY_CELL =
	'h-9 min-w-[52px] px-2 border-b border-r border-border-primary text-right align-middle text-[0.6875rem] font-semibold leading-[0.875rem]';
/** Column headers stick to the top of the scroll container. */
const STICKY_TOP = 'sticky top-0 z-20';
/** The first row-header column sticks to the left of the scroll container. */
const STICKY_LEFT = 'sticky left-0 z-10';
const MARGIN_CELL = 'bg-badge-0 text-text-primary';
/** Crosshair: the header cells of the hovered row / column. */
const CROSSHAIR_HEADER = 'bg-primary text-white';
/** Crosshair: the other cells of the hovered row / column (drawn over the fill). */
const CROSSHAIR_CELL =
	'shadow-[inset_0_0_0_999px_hsl(var(--colors-primary)/0.12)]';

interface Hover {
	row: number;
	col: number;
}

function product(
	values: ParamClassification['values'],
	keys: string[],
	upto: number
) {
	let p = 1;
	for (let x = 0; x <= upto; x++) p *= values[keys[x]].length;
	return p;
}

interface CellProps {
	iters: MatrixIteration[];
	present: boolean;
	mode: MatrixCellMode;
	selected: boolean;
	crosshair: boolean;
	onClick?: () => void;
	onHover: () => void;
}

function Cell(props: CellProps) {
	const { iters, present, mode, selected, crosshair, onClick, onHover } = props;
	const cross = crosshair && CROSSHAIR_CELL;

	if (!iters.length) {
		return present ? (
			<td
				title="Filtered out — this combination exists in other iterations"
				onMouseEnter={onHover}
				className={cn(BODY_CELL, 'text-text-menu', cross)}
			>
				<span className="inline-block size-3 rounded-sm border border-dashed border-border-primary align-middle" />
			</td>
		) : (
			<td
				title="Not observed in any iteration"
				onMouseEnter={onHover}
				className={cn(BODY_CELL, 'bg-badge-0', cross)}
				style={NOT_OBSERVED_STYLE}
			/>
		);
	}

	const summary = summarizeCell(iters);
	const tone =
		mode === 'coverage'
			? COVERAGE_CLASSES[
					Math.min(COVERAGE_CLASSES.length - 1, iters.length - 1)
			  ]
			: summary.unexpected
			? RESULT_CLASSES.unexpected
			: RESULT_CLASSES.expected;

	return (
		<td
			title={summary.title}
			onClick={onClick}
			onMouseEnter={onHover}
			aria-selected={selected || undefined}
			className={cn(
				BODY_CELL,
				tone,
				cross,
				onClick &&
					'cursor-pointer hover:ring-1 hover:ring-inset hover:ring-primary',
				selected && 'ring-2 ring-inset ring-primary'
			)}
		>
			{mode === 'coverage' ? iters.length : summary.label}
		</td>
	);
}

export function MatrixTable(props: MatrixTableProps) {
	const {
		iterations,
		visible,
		rowKeys,
		colKeys,
		values,
		mode,
		margins,
		selectedKey,
		onCellClick,
		fill = false,
		fillHeight = false,
		top
	} = props;
	const rTuples = combos(rowKeys, values);
	const cTuples = combos(colKeys, values);
	const present = presenceSet(iterations, [...rowKeys, ...colKeys]);
	const [hover, setHover] = useState<Hover | null>(null);

	// column header rows (one per col key, nested)
	const headRows: ReactNode[] = [];
	colKeys.forEach((_ck, ci) => {
		const cells: ReactNode[] = [];
		if (ci === 0) {
			cells.push(
				<th
					key="corner"
					rowSpan={colKeys.length}
					colSpan={rowKeys.length}
					className={cn(
						HEADER_CELL,
						STICKY_TOP,
						STICKY_LEFT,
						'z-30 text-[0.625rem] uppercase tracking-wide text-text-menu text-right whitespace-nowrap'
					)}
				>
					{rowKeys.join(' ▸ ')} \ {colKeys.join(' ▸ ')}
				</th>
			);
		}
		const per = cTuples.length / product(values, colKeys, ci);
		let last: string | null = null;
		cTuples.forEach((t, ti) => {
			const prefix = t.slice(0, ci + 1).join(TUPLE_SEPARATOR);
			if (prefix !== last) {
				last = prefix;
				const covers =
					hover !== null && hover.col >= ti && hover.col < ti + per;
				cells.push(
					<th
						key={`c-${ci}-${ti}`}
						colSpan={per}
						className={cn(
							HEADER_CELL,
							STICKY_TOP,
							'text-right',
							covers && CROSSHAIR_HEADER
						)}
					>
						{t[ci]}
					</th>
				);
			}
		});
		if (margins && ci === 0) {
			cells.push(
				<th
					key="mtop"
					rowSpan={colKeys.length}
					className={cn(HEADER_CELL, STICKY_TOP, MARGIN_CELL, 'text-right')}
				>
					Σ
				</th>
			);
		}
		headRows.push(<tr key={`h-${ci}`}>{cells}</tr>);
	});

	// body
	const colTotals = cTuples.map(() => 0);
	let grand = 0;
	const bodyRows = rTuples.map((rt, ri) => {
		const headers: ReactNode[] = [];
		rowKeys.forEach((_rk, i) => {
			const per = rTuples.length / product(values, rowKeys, i);
			if (ri % per === 0) {
				const covers =
					hover !== null && hover.row >= ri && hover.row < ri + per;
				headers.push(
					<th
						key={`rh-${i}`}
						rowSpan={per}
						className={cn(
							HEADER_CELL,
							i === 0 && STICKY_LEFT,
							'text-right whitespace-nowrap',
							covers && CROSSHAIR_HEADER
						)}
					>
						{rt[i]}
					</th>
				);
			}
		});
		let rowTotal = 0;
		const cells = cTuples.map((ct, ci) => {
			const iters = visible.filter(
				(d) => matchTuple(d, rowKeys, rt) && matchTuple(d, colKeys, ct)
			);
			rowTotal += iters.length;
			colTotals[ci] += iters.length;
			const key = cellKey(rt, ct);
			return (
				<Cell
					key={`cell-${ci}`}
					iters={iters}
					present={present.has(key)}
					mode={mode}
					selected={selectedKey === key}
					crosshair={hover !== null && (hover.row === ri || hover.col === ci)}
					onHover={() => setHover({ row: ri, col: ci })}
					onClick={
						iters.length && onCellClick
							? () =>
									onCellClick({ rowTuple: rt, colTuple: ct, iterations: iters })
							: undefined
					}
				/>
			);
		});
		grand += rowTotal;
		return (
			<tr key={`r-${ri}`}>
				{headers}
				{cells}
				{margins ? (
					<td className={cn(BODY_CELL, MARGIN_CELL)}>{rowTotal}</td>
				) : null}
			</tr>
		);
	});

	return (
		<div
			className={cn(
				// `isolate z-0` keeps the sticky header z-indexes inside the table so
				// they never paint over the run table's own sticky header.
				'styled-scrollbar relative isolate z-0 max-w-full overflow-auto bg-white',
				fill ? 'block w-full' : 'inline-block max-w-full',
				fill && fillHeight && 'min-h-0 flex-1'
			)}
			// Never taller than the viewport below the sticky stack: the column
			// headers stick inside this box, so it must be the thing that scrolls.
			style={{ maxHeight: `calc(100vh - ${top + VIEWPORT_BOTTOM_RESERVE}px)` }}
			onMouseLeave={() => setHover(null)}
		>
			<table
				className={cn(
					'border-separate border-spacing-0',
					'[&_tr:last-child>*]:border-b-0',
					fill ? 'w-full [&_tr>*:last-child]:border-r-0' : 'w-max',
					fill && fillHeight && 'h-full'
				)}
			>
				<thead>{headRows}</thead>
				<tbody>
					{bodyRows}
					{margins ? (
						<tr>
							<th
								colSpan={rowKeys.length}
								className={cn(
									HEADER_CELL,
									STICKY_LEFT,
									MARGIN_CELL,
									'text-right'
								)}
							>
								Σ
							</th>
							{colTotals.map((t, i) => (
								<td key={`ct-${i}`} className={cn(BODY_CELL, MARGIN_CELL)}>
									{t}
								</td>
							))}
							<td className={cn(BODY_CELL, MARGIN_CELL)}>{grand}</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}
