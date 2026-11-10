/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ReactNode,
	RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState
} from 'react';

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
	/** Every iteration this table could show (defines which combos exist). */
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
	/** Viewport offset of the sticky stack above the table, in px. */
	top: number;
	/** A small multiple: smaller tiles, stretched across its panel. */
	compact?: boolean;
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

/** The fill carries the result; the label keeps the default text colour. */
export const RESULT_CLASSES = {
	expected: 'bg-badge-3 text-text-primary',
	unexpected: 'bg-bg-fillError text-text-primary'
} as const;

/** Mixed cells: red graded by the share of unexpected iterations. */
export const MIXED_CLASSES = [
	'bg-text-unexpected/15 text-text-primary',
	'bg-text-unexpected/35 text-text-primary',
	'bg-text-unexpected/60 text-text-primary'
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

/**
 * Cells are tiles: rounded fills set apart by the table's border spacing,
 * the headers plain labels around them. The sticky headers keep an opaque
 * background so the tiles scroll under them unseen; `--matrix-gap` is the
 * spacing, which they fill too (see `HEADER_CELL`).
 */
const SIZES = {
	regular: {
		/** A header row's height plus the spacing under it, in px. */
		rowStep: 28 + 3,
		table: 'border-spacing-[3px] [--matrix-gap:3px]',
		header: 'h-7 px-2',
		body: 'h-7 min-w-[48px] px-2'
	},
	compact: {
		rowStep: 20 + 2,
		table: 'border-spacing-[2px] [--matrix-gap:2px]',
		header: 'h-5 px-1.5',
		body: 'h-5 min-w-[36px] px-1.5'
	}
} as const;
/**
 * One type size in every view: the Split's compact tables differ from the
 * single table in tile size and spacing only.
 *
 * The shadow fills the border spacing around the cell, so the tiles
 * scrolling under the sticky headers do not show through the gaps between
 * them; the cell is square, as rounded corners would leave notches where
 * four cells meet. The crosshair adds its tint through `--matrix-tint`.
 */
const HEADER_CELL =
	'bg-bg-primary text-[0.6875rem] leading-[0.875rem] font-semibold whitespace-nowrap text-text-menu [box-shadow:0_0_0_var(--matrix-gap)_hsl(var(--colors-bg-primary)),var(--matrix-tint)]';
const BODY_CELL =
	'rounded text-center align-middle text-xs font-semibold tabular-nums';
/** Column headers stick to the top of the scroll container, each header
 * row below the ones above it (its `top` comes from `SIZES.rowStep`). */
const STICKY_TOP = 'sticky z-20';
/** An axis name: small capitals, beside or above that axis's values. */
const AXIS_LABEL = 'text-[0.625rem] uppercase tracking-wide';
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
	'[--matrix-tint:inset_0_0_0_999px_hsl(var(--colors-primary)/0.18)] text-primary';

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
 * when a panel stretches its table).
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

/**
 * A pinned header edge's shadow, in the app's sticky shadow colour. One
 * strip along the whole edge rather than a shadow per header cell, which
 * would break at every gap between the cells.
 */
const PIN_SHADOW =
	'pointer-events-none absolute from-[color:var(--shadow-color)] to-transparent';

/** Which headers have tiles scrolled under them. */
interface Pinned {
	top: boolean;
	left: boolean;
}

interface PinnedEdges {
	/** Bottom of the column headers, from the top of the scroll box. */
	bottom: number;
	/** Right of the row headers, from the left of the scroll box. */
	right: number;
	/** The scroll box's visible size, without its scrollbars. */
	width: number;
	height: number;
}

/**
 * Where the pinned headers end inside the scroll box, read off their
 * corner cell, which sticks both ways. Measured again once they pin: stuck,
 * the headers close up the spacing they have in the table's own layout.
 */
function usePinnedEdges(
	scrollRef: RefObject<HTMLDivElement>,
	cornerRef: RefObject<HTMLTableCellElement>,
	rowKeys: string[],
	colKeys: string[],
	pinned: Pinned
): PinnedEdges | null {
	const [edges, setEdges] = useState<PinnedEdges | null>(null);

	useLayoutEffect(() => {
		const box = scrollRef.current;
		const corner = cornerRef.current;
		if (!box || !corner) return;

		function measure() {
			if (!box || !corner) return;
			const b = box.getBoundingClientRect();
			const c = corner.getBoundingClientRect();
			const next = {
				bottom: c.bottom - b.top - box.clientTop,
				right: c.right - b.left - box.clientLeft,
				width: box.clientWidth,
				height: box.clientHeight
			};
			setEdges((prev) =>
				prev &&
				prev.bottom === next.bottom &&
				prev.right === next.right &&
				prev.width === next.width &&
				prev.height === next.height
					? prev
					: next
			);
		}

		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(box);
		observer.observe(corner);
		return () => observer.disconnect();
	}, [scrollRef, cornerRef, rowKeys, colKeys, pinned.top, pinned.left]);

	return edges;
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
	/** `BODY_CELL` with its size. */
	cellClass: string;
	iters: MatrixIteration[];
	present: boolean;
	mode: MatrixCellMode;
	selected: boolean;
	crosshair: boolean;
	onClick?: () => void;
	onHover: () => void;
}

function Cell(props: CellProps) {
	const {
		cellClass,
		iters,
		present,
		mode,
		selected,
		crosshair,
		onClick,
		onHover
	} = props;
	const cross = crosshair && CROSSHAIR_CELL;

	if (!iters.length) {
		return present ? (
			<td
				title="Filtered out — this combination exists in other iterations"
				onMouseEnter={onHover}
				className={cn(
					cellClass,
					'border border-dashed border-border-primary',
					cross
				)}
			/>
		) : (
			<td
				title="Not observed in any iteration"
				onMouseEnter={onHover}
				className={cn(cellClass, 'bg-badge-0', cross)}
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
				cellClass,
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
		top,
		compact = false
	} = props;
	const size = SIZES[compact ? 'compact' : 'regular'];
	const headerCell = cn(HEADER_CELL, size.header);
	const bodyCell = cn(BODY_CELL, size.body);
	const rTuples = combos(rowKeys, values);
	const cTuples = combos(colKeys, values);
	const present = presenceSet(iterations, [...rowKeys, ...colKeys]);
	const [hover, setHover] = useState<Hover | null>(null);
	const scrollRef = useCtrlWheelHorizontalScroll();
	// Which headers have tiles under them, so their edges cast a shadow.
	const [pinned, setPinned] = useState<Pinned>({ top: false, left: false });
	const lastLevel = rowKeys.length - 1;
	const cornerRef = useRef<HTMLTableCellElement>(null);
	const edges = usePinnedEdges(scrollRef, cornerRef, rowKeys, colKeys, pinned);
	const rowHeader = useRowHeaderOffsets(rowKeys);

	// Column header rows, one per col key, nested. Each names its key just
	// left of its values ("TSO_SEGSZ →"); a last header row names each row
	// key above its own values ("PAYLOAD_LEN ↓"), so neither axis has to be
	// read off a combined "rows \ cols" corner.
	const headRows: ReactNode[] = [];
	const rowTop = (level: number) => ({ top: level * size.rowStep });
	colKeys.forEach((ck, ci) => {
		const cells: ReactNode[] = [
			<th
				key="axis"
				colSpan={rowKeys.length}
				className={cn(
					headerCell,
					STICKY_TOP,
					STICKY_LEFT,
					AXIS_LABEL,
					'z-30 text-right'
				)}
				style={rowTop(ci)}
			>
				{ck} →
			</th>
		];
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
							headerCell,
							STICKY_TOP,
							'text-center',
							covers && CROSSHAIR_HEADER
						)}
						style={rowTop(ci)}
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
					rowSpan={colKeys.length + 1}
					className={cn(headerCell, STICKY_TOP, MARGIN_CELL, 'text-center')}
					style={rowTop(0)}
				>
					Σ
				</th>
			);
		}
		headRows.push(<tr key={`h-${ci}`}>{cells}</tr>);
	});
	headRows.push(
		<tr key="h-rows">
			{rowKeys.map((rk, i) => (
				<th
					key={`axis-${i}`}
					className={cn(
						headerCell,
						STICKY_TOP,
						STICKY_LEFT,
						AXIS_LABEL,
						'z-30 text-right'
					)}
					// The corner of the pinned headers, where their shadows start.
					ref={i === lastLevel ? cornerRef : undefined}
					style={{
						...rowTop(colKeys.length),
						...(i > 0 ? { left: rowHeader.lefts[i] ?? 0 } : undefined)
					}}
				>
					{rk} ↓
				</th>
			))}
			{/* Opaque, so the tiles scroll under this row unseen. */}
			<th
				aria-hidden
				colSpan={cTuples.length}
				className={cn(headerCell, STICKY_TOP)}
				style={rowTop(colKeys.length)}
			/>
		</tr>
	);

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
							headerCell,
							STICKY_LEFT,
							// Row values read as the axis labels: default colour, figures
							// aligned.
							'text-right font-normal tabular-nums text-text-primary',
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
					cellClass={bodyCell}
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
					<td className={cn(bodyCell, MARGIN_CELL)}>{rowTotal}</td>
				) : null}
			</tr>
		);
	});

	return (
		// The scroll box, with the shadows of the pinned header edges laid
		// over it: outside it, so they stay put while the tiles scroll.
		<div
			className={cn(
				'relative max-w-full',
				compact ? 'block w-full' : 'inline-block'
			)}
		>
			<div
				// `isolate z-0` keeps the sticky header z-indexes inside the table so
				// they never paint over the run table's own sticky header.
				className="styled-scrollbar relative isolate z-0 block max-w-full overflow-auto bg-bg-primary"
				// Never taller than the viewport below the sticky stack: the column
				// headers stick inside this box, so it must be the thing that scrolls.
				style={{
					maxHeight: `calc(100vh - ${top + VIEWPORT_BOTTOM_RESERVE}px)`
				}}
				ref={scrollRef}
				onMouseLeave={() => setHover(null)}
				onScroll={(e) => {
					const { scrollTop, scrollLeft } = e.currentTarget;
					const next = { top: scrollTop > 0, left: scrollLeft > 0 };
					setPinned((prev) =>
						prev.top === next.top && prev.left === next.left ? prev : next
					);
				}}
			>
				<table
					className={cn(
						'border-separate',
						'[--matrix-tint:0_0_#0000]',
						size.table,
						compact ? 'w-full' : 'w-max'
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
										headerCell,
										STICKY_LEFT,
										MARGIN_CELL,
										'text-right'
									)}
								>
									Σ
								</th>
								{colTotals.map((t, i) => (
									<td key={`ct-${i}`} className={cn(bodyCell, MARGIN_CELL)}>
										{t}
									</td>
								))}
								<td className={cn(bodyCell, MARGIN_CELL)}>{grand}</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
			{pinned.top && edges ? (
				<div
					aria-hidden
					className={cn(PIN_SHADOW, 'left-0 h-2 bg-gradient-to-b')}
					style={{ top: edges.bottom, width: edges.width }}
				/>
			) : null}
			{pinned.left && edges ? (
				<div
					aria-hidden
					className={cn(PIN_SHADOW, 'top-0 w-2 bg-gradient-to-r')}
					style={{ left: edges.right, height: edges.height }}
				/>
			) : null}
		</div>
	);
}
