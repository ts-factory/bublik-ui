/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

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
}

export const TUPLE_SEPARATOR = '¦';

export function cellKey(rowTuple: string[], colTuple: string[]): string {
	return [...rowTuple, ...colTuple].join(TUPLE_SEPARATOR);
}

/** Blue ramp: the app uses primary for neutral counts (totals, "run"). */
export const COVERAGE_CLASSES = [
	'bg-primary/10',
	'bg-primary/20',
	'bg-primary/35',
	'bg-primary/55 text-white'
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
	'bg-primary-wash px-2 py-1 h-9 border-b border-r border-border-primary text-[0.6875rem] font-semibold leading-[0.875rem]';
const BODY_CELL =
	'h-9 min-w-[52px] px-2 border-b border-r border-border-primary text-center align-middle text-[0.6875rem] font-semibold leading-[0.875rem]';
const MARGIN_CELL = 'bg-badge-0 text-text-primary';

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
	onClick?: () => void;
}

function Cell(props: CellProps) {
	const { iters, present, mode, selected, onClick } = props;

	if (!iters.length) {
		return present ? (
			<td
				title="Filtered out — this combination exists in other iterations"
				className={cn(BODY_CELL, 'text-text-menu')}
			>
				<span className="inline-block size-3 rounded-sm border border-dashed border-border-primary align-middle" />
			</td>
		) : (
			<td
				title="Not observed in any iteration"
				className={cn(BODY_CELL, 'bg-badge-0')}
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
			aria-selected={selected || undefined}
			className={cn(
				BODY_CELL,
				tone,
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
		onCellClick
	} = props;
	const rTuples = combos(rowKeys, values);
	const cTuples = combos(colKeys, values);
	const present = presenceSet(iterations, [...rowKeys, ...colKeys]);

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
						'text-[0.625rem] uppercase tracking-wide text-text-menu text-right whitespace-nowrap'
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
				cells.push(
					<th
						key={`c-${ci}-${ti}`}
						colSpan={per}
						className={cn(HEADER_CELL, 'text-center')}
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
					className={cn(HEADER_CELL, MARGIN_CELL, 'text-center')}
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
				headers.push(
					<th
						key={`rh-${i}`}
						rowSpan={per}
						className={cn(HEADER_CELL, 'text-right whitespace-nowrap')}
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
		<div className="inline-block max-w-full overflow-auto rounded-md border border-border-primary bg-white">
			<table
				className={cn(
					'border-separate border-spacing-0',
					'[&_tr:last-child>*]:border-b-0 [&_tr>*:last-child]:border-r-0'
				)}
			>
				<thead>{headRows}</thead>
				<tbody>
					{bodyRows}
					{margins ? (
						<tr>
							<th
								colSpan={rowKeys.length}
								className={cn(HEADER_CELL, MARGIN_CELL, 'text-right')}
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
