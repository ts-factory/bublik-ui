/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { QueryParamConfig, useQueryParam, withDefault } from 'use-query-params';

import { CompressedJsonParam } from '../run-table/run-table.hooks';
import { MatrixSuggestion, ParamClassification } from './matrix-analysis';

export type ResultViewMode = 'list' | 'matrix';
export type MatrixCellMode = 'coverage' | 'result';
export type MatrixFacetMode = 'filter' | 'trellis';

/** Value meaning "no facet filter" for a facet parameter. */
export const FACET_ALL = '__all__';

/**
 * Per-row view state stored in the `resultView` query param. Every field is
 * optional: a missing field means "use the default", so only what the user
 * changed ends up in the URL.
 */
export interface ResultViewState {
	view?: ResultViewMode;
	rows?: string[];
	cols?: string[];
	facets?: string[];
	facetSel?: Record<string, string>;
	facetMode?: MatrixFacetMode;
	mode?: MatrixCellMode;
	margins?: boolean;
}

export type ResultViewParam = Record<string, ResultViewState>;

/** Fully resolved matrix configuration used for rendering. */
export interface MatrixState {
	rows: string[];
	cols: string[];
	facets: string[];
	facetSel: Record<string, string>;
	facetMode: MatrixFacetMode;
	mode: MatrixCellMode;
	margins: boolean;
}

export const DEFAULT_VIEW: ResultViewMode = 'list';

const MATRIX_KEYS: (keyof ResultViewState)[] = [
	'rows',
	'cols',
	'facets',
	'facetSel',
	'facetMode',
	'mode',
	'margins'
];

const ResultViewQueryParam = withDefault(
	CompressedJsonParam as QueryParamConfig<ResultViewParam, ResultViewParam>,
	{}
);

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Drop keys whose value is `undefined` so the URL only carries real choices. */
function compact(state: ResultViewState): ResultViewState {
	return Object.fromEntries(
		Object.entries(state).filter(([, value]) => value !== undefined)
	) as ResultViewState;
}

/**
 * Merge the (possibly stale or partial) URL state with the defaults derived
 * from the data. Parameters that no longer vary are dropped; if that leaves
 * rows or columns empty the first suggestion (or the first varying params)
 * is used instead.
 */
export function resolveMatrixState(
	state: ResultViewState | undefined,
	cls: ParamClassification,
	suggestions: MatrixSuggestion[]
): MatrixState {
	const known = new Set(cls.varying);
	const keep = (list?: string[]) => (list ?? []).filter((k) => known.has(k));

	const first = suggestions[0];
	const defaults = {
		rows: first?.rows ?? cls.varying.slice(0, 1),
		cols: first?.cols ?? cls.varying.slice(1, 2),
		facets: first?.facets ?? cls.varying.slice(2)
	};

	const hasAxes =
		state?.rows !== undefined ||
		state?.cols !== undefined ||
		state?.facets !== undefined;

	let rows = hasAxes ? keep(state?.rows) : defaults.rows;
	let cols = hasAxes ? keep(state?.cols) : defaults.cols;
	let facets = hasAxes ? keep(state?.facets) : defaults.facets;

	if (!rows.length || !cols.length) {
		rows = defaults.rows;
		cols = defaults.cols;
		facets = defaults.facets;
	}

	// A parameter can only play one role.
	const used = new Set<string>();
	const unique = (list: string[]) =>
		list.filter((k) => {
			if (used.has(k)) return false;
			used.add(k);
			return true;
		});
	rows = unique(rows);
	cols = unique(cols);
	facets = unique(facets);

	const facetSel: Record<string, string> = {};
	for (const k of cls.varying) {
		const selected = isObject(state?.facetSel)
			? state?.facetSel?.[k]
			: undefined;
		facetSel[k] =
			typeof selected === 'string' &&
			(selected === FACET_ALL || cls.values[k]?.includes(selected))
				? selected
				: FACET_ALL;
	}

	return {
		rows,
		cols,
		facets,
		facetSel,
		facetMode: state?.facetMode ?? 'filter',
		mode: state?.mode ?? 'coverage',
		margins: state?.margins ?? false
	};
}

/** True when the layout part of `state` equals the suggestion. */
export function isLayoutApplied(
	state: Pick<MatrixState, 'rows' | 'cols' | 'facets'>,
	suggestion: Pick<MatrixSuggestion, 'rows' | 'cols' | 'facets'>
): boolean {
	const same = (a: string[], b: string[]) =>
		a.length === b.length && a.every((v, i) => v === b[i]);

	return (
		same(state.rows, suggestion.rows) &&
		same(state.cols, suggestion.cols) &&
		same(state.facets, suggestion.facets)
	);
}

export function useResultView(rowId: string) {
	const [param, setParam] = useQueryParam<ResultViewParam>(
		'resultView',
		ResultViewQueryParam,
		{ updateType: 'replaceIn' }
	);

	const state = useMemo<ResultViewState>(() => {
		const value = param?.[rowId];

		return isObject(value) ? (value as ResultViewState) : {};
	}, [param, rowId]);

	const write = useCallback(
		(next: ResultViewState) => {
			setParam((prev) => {
				const rest = { ...(prev ?? {}) };
				const compacted = compact(next);

				if (Object.keys(compacted).length === 0) {
					delete rest[rowId];
					return rest;
				}

				return { ...rest, [rowId]: compacted };
			});
		},
		[rowId, setParam]
	);

	const patch = useCallback(
		(changes: ResultViewState) => write({ ...state, ...changes }),
		[state, write]
	);

	const resetMatrix = useCallback(() => {
		const next = { ...state };

		for (const key of MATRIX_KEYS) delete next[key];

		write(next);
	}, [state, write]);

	return {
		state,
		view: state.view ?? DEFAULT_VIEW,
		patch,
		resetMatrix
	};
}

export type MatrixRole = 'rows' | 'cols' | 'facets' | 'unused';

export function roleOf(
	state: Pick<MatrixState, 'rows' | 'cols' | 'facets'>,
	param: string
): MatrixRole {
	if (state.rows.includes(param)) return 'rows';
	if (state.cols.includes(param)) return 'cols';
	if (state.facets.includes(param)) return 'facets';
	return 'unused';
}

/** Move `param` to `role`, removing it from every other role. */
export function assignRole(
	state: Pick<MatrixState, 'rows' | 'cols' | 'facets'>,
	param: string,
	role: MatrixRole
): Pick<MatrixState, 'rows' | 'cols' | 'facets'> {
	const next = {
		rows: state.rows.filter((p) => p !== param),
		cols: state.cols.filter((p) => p !== param),
		facets: state.facets.filter((p) => p !== param)
	};
	if (role !== 'unused') next[role] = [...next[role], param];
	return next;
}
