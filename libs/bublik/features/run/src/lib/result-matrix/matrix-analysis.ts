/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { RunDataResults } from '@/shared/types';

/** A single iteration reduced to what the matrix needs. */
export interface MatrixIteration {
	resultId: number;
	params: Record<string, string>;
	resultType: string;
	hasError: boolean;
	hasMeasurements: boolean;
	/** The row the iteration came from, for links and details. */
	source: RunDataResults;
}

/** Parse `["name=value", ...]` into a `{ name: value }` map. */
export function parseParams(parameters: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const p of parameters) {
		const i = p.indexOf('=');
		if (i === -1) out[p] = '';
		else out[p.slice(0, i)] = p.slice(i + 1);
	}
	return out;
}

/** The value of a parameter some iterations of the test do not have. */
export const PARAM_NOT_SET = '—';

/**
 * Every iteration gets every parameter any of them has, so that one lacking a
 * parameter still lands in a cell (under `PARAM_NOT_SET`) rather than in none.
 */
export function toIterations(results: RunDataResults[]): MatrixIteration[] {
	const parsed = results.map((r) => parseParams(r.parameters ?? []));
	const names = new Set(parsed.flatMap((params) => Object.keys(params)));

	return results.map((r, i) => ({
		resultId: r.result_id,
		params: Object.fromEntries(
			[...names].map((name) => [name, parsed[i][name] ?? PARAM_NOT_SET])
		),
		resultType: r.obtained_result?.result_type ?? '',
		hasError: Boolean(r.has_error),
		hasMeasurements: Boolean(r.has_measurements),
		source: r
	}));
}

export interface ParamClassification {
	/** Params that take more than one value across the iterations. */
	varying: string[];
	/** Params with a single value, shown as fixed context. */
	fixed: { name: string; value: string }[];
	/** Sorted distinct values per param (numeric-aware). */
	values: Record<string, string[]>;
}

const byNatural = (a: string, b: string) =>
	String(a).localeCompare(String(b), undefined, { numeric: true });

export function classifyParams(iters: MatrixIteration[]): ParamClassification {
	const seen: Record<string, Set<string>> = {};
	for (const it of iters) {
		for (const [k, v] of Object.entries(it.params)) {
			(seen[k] ??= new Set()).add(v);
		}
	}
	const values: Record<string, string[]> = {};
	const varying: string[] = [];
	const fixed: { name: string; value: string }[] = [];
	for (const [k, set] of Object.entries(seen)) {
		values[k] = [...set].sort(byNatural);
		if (set.size > 1) varying.push(k);
		else fixed.push({ name: k, value: [...set][0] ?? '' });
	}
	varying.sort(byNatural);
	fixed.sort((a, b) => byNatural(a.name, b.name));
	return { varying, fixed, values };
}

export const cardOf = (values: ParamClassification['values'], k: string) =>
	values[k]?.length ?? 0;

/** Cartesian product of the value sets of `keys`, in stable order. */
export function combos(
	keys: string[],
	values: ParamClassification['values']
): string[][] {
	let acc: string[][] = [[]];
	for (const k of keys) {
		const next: string[][] = [];
		for (const tuple of acc)
			for (const v of values[k]) next.push([...tuple, v]);
		acc = next;
	}
	return acc;
}

/** How many tuples `combos` would build, without building them. */
export function comboCount(
	keys: string[],
	values: ParamClassification['values']
): number {
	return keys.reduce((count, k) => count * cardOf(values, k), 1);
}

/** Most Split panels drawn when the facet values' combinations are all drawn. */
const MAX_SPLIT_COMBOS = 64;

/**
 * The tuples of `keys` a Split draws a panel for: all of them, unless there
 * are too many to draw, as a test's many facets multiply out far beyond its
 * iterations; then only those that occur in `iters`, in the same order.
 */
export function facetTuples(
	keys: string[],
	values: ParamClassification['values'],
	iters: MatrixIteration[]
): string[][] {
	if (comboCount(keys, values) <= MAX_SPLIT_COMBOS) return combos(keys, values);

	const seen = new Map<string, string[]>();
	for (const it of iters) {
		const tuple = keys.map((k) => it.params[k]);
		seen.set(tuple.join('¦'), tuple);
	}

	return [...seen.values()].sort((a, b) => {
		for (let i = 0; i < keys.length; i++) {
			const order = byNatural(a[i], b[i]);
			if (order) return order;
		}
		return 0;
	});
}

export function matchTuple(
	it: MatrixIteration,
	keys: string[],
	tuple: string[]
): boolean {
	return keys.every((k, i) => it.params[k] === tuple[i]);
}

/** Set of joined value-tuples of `keys` that occur in `iters`. */
export function presenceSet(
	iters: MatrixIteration[],
	keys: string[]
): Set<string> {
	const s = new Set<string>();
	for (const it of iters) s.add(keys.map((k) => it.params[k]).join('¦'));
	return s;
}

/** Fraction of the `a x b` grid that is actually populated. */
export function fillRatio(
	iters: MatrixIteration[],
	a: string,
	b: string,
	values: ParamClassification['values']
): number {
	const present = presenceSet(iters, [a, b]).size;
	const cells = cardOf(values, a) * cardOf(values, b);
	return cells ? present / cells : 0;
}

export interface MatrixLayout {
	rows: string[];
	cols: string[];
	facets: string[];
}

export interface MatrixSuggestion extends MatrixLayout {
	id: string;
	/** The kind of layout only: the rail spells out its axes from rows and cols. */
	label: string;
	rationale: string;
	score: string;
}

/**
 * Suggest layouts from parameter variability and coverage. Association is used
 * implicitly (fill ratio distinguishes independent from constrained pairs) but
 * is not surfaced as a separate visualization.
 */
export function suggestLayouts(
	iters: MatrixIteration[],
	cls: ParamClassification
): MatrixSuggestion[] {
	const { varying, values } = cls;
	const card = (k: string) => cardOf(values, k);
	if (varying.length < 2) return [];

	const byCard = [...varying].sort((x, y) => card(y) - card(x));
	const pairs: { a: string; b: string; cells: number; fill: number }[] = [];
	for (const a of varying)
		for (const b of varying)
			if (a < b)
				pairs.push({
					a,
					b,
					cells: card(a) * card(b),
					fill: fillRatio(iters, a, b, values)
				});

	const dense = [...pairs].sort((x, y) => y.fill - x.fill)[0];
	const gappy = [...pairs].sort(
		(x, y) => y.cells * (1 - y.fill) - x.cells * (1 - x.fill)
	)[0];
	const low = [...varying].sort((x, y) => card(x) - card(y));

	const rest = (used: string[]) => varying.filter((k) => !used.includes(k));

	const out: MatrixSuggestion[] = [
		{
			id: 'balanced',
			rows: [byCard[0]],
			cols: [byCard[1]],
			facets: byCard.slice(2),
			label: 'Balanced',
			rationale: `Two highest-variability params on the axes (×${card(
				byCard[0]
			)}, ×${card(byCard[1])}).`,
			score: `${card(byCard[0])}×${card(byCard[1])}`
		},
		{
			id: 'densest',
			rows: [dense.a],
			cols: [dense.b],
			facets: rest([dense.a, dense.b]),
			label: 'Densest',
			rationale:
				dense.fill === 1
					? 'Independent pair — every cell filled.'
					: `Most filled pair — ${Math.round(
							dense.fill * 100
					  )}% of cells filled.`,
			score: `${Math.round(dense.fill * 100)}% filled`
		}
	];

	// A full grid has no gaps to expose.
	if (gappy.fill < 1) {
		out.push({
			id: 'gaps',
			rows: [gappy.a],
			cols: [gappy.b],
			facets: rest([gappy.a, gappy.b]),
			label: 'Expose gaps',
			rationale: `Constrained pair — surfaces ~${Math.round(
				gappy.cells * (1 - gappy.fill)
			)} missing / N/A combinations.`,
			score: `${Math.round((1 - gappy.fill) * 100)}% gaps`
		});
	}

	if (varying.length >= 4 && low[0] !== byCard[0] && low[0] !== byCard[1]) {
		out.push({
			id: 'nested',
			rows: [byCard[0], low[0]],
			cols: [byCard[1]],
			facets: rest([byCard[0], low[0], byCard[1]]),
			label: 'Nested rows',
			rationale: `Pack low-variability ${low[0]} (×${card(low[0])}) under ${
				byCard[0]
			} to show three dimensions without a facet.`,
			score: '3 dims'
		});
	}

	// With few parameters several of them land on one layout: offer it once.
	const layouts = new Set<string>();
	return out.filter((s) => {
		const layout = JSON.stringify([s.rows, s.cols, s.facets]);
		if (layouts.has(layout)) return false;
		layouts.add(layout);
		return true;
	});
}

export interface CellSummary {
	count: number;
	expected: number;
	unexpected: number;
	/** Text shown in a "result" cell: the result initial for one iteration, the count otherwise. */
	label: string;
	/** Hover text describing the split. */
	title: string;
}

/** Aggregate the iterations of one matrix cell for the "result" cell mode. */
export function summarizeCell(iters: MatrixIteration[]): CellSummary {
	const count = iters.length;
	const unexpected = iters.filter((it) => it.hasError).length;
	const expected = count - unexpected;

	const single = count === 1 ? iters[0] : undefined;
	const mixed = unexpected > 0 && expected > 0;
	// A mixed cell says how many failed out of how many, so a red cell is
	// never mistaken for "all failed".
	const label = single
		? single.resultType.charAt(0).toUpperCase() || '1'
		: mixed
		? `${unexpected}/${count}`
		: String(count);

	const title = single
		? `${single.resultType || 'unknown'} · ${
				single.hasError ? 'unexpected' : 'expected'
		  }`
		: `${count} iterations · ${expected} expected · ${unexpected} unexpected`;

	return { count, expected, unexpected, label, title };
}
