/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

/** Mixed cells: red graded by the share of unexpected iterations. */
export const MIXED_CLASSES = [
	'bg-text-unexpected/15 text-text-unexpected',
	'bg-text-unexpected/35 text-text-unexpected',
	'bg-text-unexpected/60 text-white'
];

/**
 * Tone of a Result-mode cell. Uniform cells use the badge washes (so a
 * single failed iteration is not shouting); mixed cells step through
 * `MIXED_CLASSES` at ≤⅓, ≤⅔ and above.
 */
export function resultClass(unexpected: number, count: number): string {
	if (!unexpected) return RESULT_CLASSES.expected;
	if (unexpected >= count) return RESULT_CLASSES.unexpected;
	const share = unexpected / count;
	return MIXED_CLASSES[share <= 1 / 3 ? 0 : share <= 2 / 3 ? 1 : 2];
}

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
/** Row-header columns stick to the left of the scroll container; every
 * level after the first gets its `left` from `useRowHeaderOffsets`. */
const STICKY_LEFT = 'sticky left-0 z-10';
const MARGIN_CELL = 'bg-badge-0 text-text-primary';
/** Crosshair: the other cells of the hovered row / column (drawn over the fill). */
const CROSSHAIR_CELL =
	'shadow-[inset_0_0_0_999px_hsl(var(--colors-primary)/0.12)]';
/**
 * Crosshair: the header cells of the hovered row / column. A slightly
 * stronger tint than the body cells plus primary text, drawn as an inset
 * shadow so the sticky headers keep their opaque background.
 */
const CROSSHAIR_HEADER =
	'shadow-[inset_0_0_0_999px_hsl(var(--colors-primary)/0.18)] text-primary';

interface Hover {
	row: number;
	col: number;
}

/**
 * Ctrl + wheel scrolls the box sideways, the same gesture as the runs
 * progress strip. A native, non-passive listener is needed: React's
 * onWheel is passive, so it could not stop the browser's Ctrl + wheel zoom.
 */
function useCtrlWheelHorizontalScroll() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		function onWheel(e: WheelEvent) {
			if (!e.ctrlKey) return;
			const delta = e.deltaY || e.deltaX;
			if (!delta) return;
			el?.scrollBy({ left: delta });
			e.preventDefault();
		}

		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, []);

	return ref;
}

/**
 * Left offsets for the nested row-header columns, so each level can stick
 * next to the previous one. The widths depend on content, so the cells of
 * the first body row are measured and re-measured when they resize (e.g.
 * when Stretch is toggled).
 */
function useRowHeaderOffsets(rowKeys: string[]) {
	const count = rowKeys.length;
	const cells = useRef<(HTMLTableCellElement | null)[]>([]);
	const [lefts, setLefts] = useState<number[]>([]);

	useLayoutEffect(() => {
		const els = cells.current.slice(0, count);

		function measure() {
			const next: number[] = [];
			let left = 0;
			for (const el of els) {
				next.push(left);
				left += el?.getBoundingClientRect().width ?? 0;
			}
			setLefts((prev) =>
				prev.length === next.length && prev.every((v, i) => v === next[i])
					? prev
					: next
			);
		}

		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		for (const el of els) if (el) observer.observe(el);
		return () => observer.disconnect();
	}, [count, rowKeys]);

	const setCell = (level: number) => (el: HTMLTableCellElement | null) => {
		cells.current[level] = el;
	};

	return { lefts, setCell };
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
			: resultClass(summary.unexpected, summary.count);

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
	const scrollRef = useCtrlWheelHorizontalScroll();
	const rowHeader = useRowHeaderOffsets(rowKeys);

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
						ref={ri === 0 ? rowHeader.setCell(i) : undefined}
						rowSpan={per}
						className={cn(
							HEADER_CELL,
							STICKY_LEFT,
							'text-right whitespace-nowrap',
							covers && CROSSHAIR_HEADER
						)}
						style={i > 0 ? { left: rowHeader.lefts[i] ?? 0 } : undefined}
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
			ref={scrollRef}
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
