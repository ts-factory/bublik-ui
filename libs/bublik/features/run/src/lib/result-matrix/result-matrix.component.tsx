/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useState } from 'react';

import { RunDataResults } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import {
	MatrixIteration,
	MatrixSuggestion,
	classifyParams,
	combos,
	suggestLayouts,
	toIterations
} from './matrix-analysis';
import { CellMode, MatrixTable } from './matrix-table';

type Role = 'rows' | 'cols' | 'facets' | 'unused';

interface MatrixState {
	rows: string[];
	cols: string[];
	facets: string[];
	mode: CellMode;
	facetMode: 'filter' | 'trellis';
	margins: boolean;
	facetSel: Record<string, string>;
}

const ALL = '__all__';

function Segmented<T extends string>(props: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="inline-flex rounded-md border border-border-primary overflow-hidden">
			{props.options.map((o) => (
				<button
					key={o.value}
					type="button"
					aria-pressed={props.value === o.value}
					onClick={() => props.onChange(o.value)}
					className={cn(
						'px-2.5 py-1 text-xs border-r border-border-primary last:border-r-0',
						props.value === o.value
							? 'bg-primary text-white'
							: 'bg-white hover:bg-gray-50'
					)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}

function roleOf(state: MatrixState, param: string): Role {
	if (state.rows.includes(param)) return 'rows';
	if (state.cols.includes(param)) return 'cols';
	if (state.facets.includes(param)) return 'facets';
	return 'unused';
}

function assignRole(
	state: MatrixState,
	param: string,
	role: Role
): MatrixState {
	const next: MatrixState = {
		...state,
		rows: state.rows.filter((p) => p !== param),
		cols: state.cols.filter((p) => p !== param),
		facets: state.facets.filter((p) => p !== param)
	};
	if (role !== 'unused') next[role] = [...next[role], param];
	return next;
}

export interface ResultMatrixProps {
	results: RunDataResults[];
}

export function ResultMatrix({ results }: ResultMatrixProps) {
	const iterations = useMemo(() => toIterations(results), [results]);
	const cls = useMemo(() => classifyParams(iterations), [iterations]);
	const suggestions = useMemo(
		() => suggestLayouts(iterations, cls),
		[iterations, cls]
	);

	const [state, setState] = useState<MatrixState>(() => {
		const first = suggestions[0];
		const base: MatrixState = {
			rows: first?.rows ?? cls.varying.slice(0, 1),
			cols: first?.cols ?? cls.varying.slice(1, 2),
			facets: first?.facets ?? cls.varying.slice(2),
			mode: 'coverage',
			facetMode: 'filter',
			margins: false,
			facetSel: Object.fromEntries(cls.varying.map((k) => [k, ALL]))
		};
		return base;
	});

	const applyLayout = (s: MatrixSuggestion) =>
		setState((prev) => ({
			...prev,
			rows: [...s.rows],
			cols: [...s.cols],
			facets: [...s.facets],
			facetSel: Object.fromEntries(cls.varying.map((k) => [k, ALL]))
		}));

	if (cls.varying.length < 2) {
		return (
			<div className="p-4 text-sm text-text-menu">
				This test has fewer than two varying parameters — nothing to cross in a
				matrix.
			</div>
		);
	}

	const canRender = state.rows.length > 0 && state.cols.length > 0;
	const facetFilter = (it: MatrixIteration) =>
		state.facets.every(
			(k) => state.facetSel[k] === ALL || it.params[k] === state.facetSel[k]
		);

	return (
		<div className="flex flex-col gap-3 p-2 text-sm">
			<div className="flex flex-wrap items-start gap-4">
				{/* Suggestions */}
				<div className="flex flex-col gap-1.5 min-w-[240px]">
					<span className="text-[10px] uppercase tracking-wide text-text-menu">
						Suggested layouts
					</span>
					{suggestions.map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => applyLayout(s)}
							className="text-left rounded-md border border-border-primary bg-white px-2.5 py-1.5 hover:bg-gray-50"
						>
							<span className="float-right text-[10px] text-primary">
								{s.score}
							</span>
							<span className="block text-xs font-semibold">{s.label}</span>
							<span className="block text-[10px] text-text-menu">
								{s.rationale}
							</span>
						</button>
					))}
				</div>

				{/* Structure */}
				<div className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-wide text-text-menu">
						Structure
					</span>
					{cls.varying.map((k) => (
						<div key={k} className="flex items-center gap-2">
							<span className="w-32 truncate text-xs">
								{k}
								<span className="ml-1 text-primary">
									×{cls.values[k].length}
								</span>
							</span>
							<Segmented<Role>
								value={roleOf(state, k)}
								onChange={(role) => setState((p) => assignRole(p, k, role))}
								options={[
									{ value: 'rows', label: 'Rows' },
									{ value: 'cols', label: 'Cols' },
									{ value: 'facets', label: 'Facet' },
									{ value: 'unused', label: '—' }
								]}
							/>
						</div>
					))}
					{cls.fixed.length ? (
						<span className="mt-1 text-[10px] text-text-menu">
							Fixed ({cls.fixed.length}):{' '}
							{cls.fixed.map((f) => `${f.name}=${f.value}`).join(', ')}
						</span>
					) : null}
				</div>
			</div>

			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-4">
				<label className="flex items-center gap-2 text-xs">
					<span className="text-text-menu">Cell</span>
					<Segmented<CellMode>
						value={state.mode}
						onChange={(mode) => setState((p) => ({ ...p, mode }))}
						options={[
							{ value: 'coverage', label: 'Coverage' },
							{ value: 'result', label: 'Result' }
						]}
					/>
				</label>
				<label className="flex items-center gap-2 text-xs">
					<span className="text-text-menu">Facets</span>
					<Segmented<'filter' | 'trellis'>
						value={state.facetMode}
						onChange={(facetMode) => setState((p) => ({ ...p, facetMode }))}
						options={[
							{ value: 'filter', label: 'Filter' },
							{ value: 'trellis', label: 'Small multiples' }
						]}
					/>
				</label>
				<label className="flex items-center gap-1.5 text-xs">
					<input
						type="checkbox"
						checked={state.margins}
						onChange={(e) =>
							setState((p) => ({ ...p, margins: e.target.checked }))
						}
					/>
					margins
				</label>
			</div>

			{/* Facet filters */}
			{state.facetMode === 'filter' && state.facets.length ? (
				<div className="flex flex-wrap items-center gap-3 text-xs">
					<span className="text-text-menu">Facets</span>
					{state.facets.map((k) => (
						<label key={k} className="flex items-center gap-1">
							{k}:
							<select
								className="border border-border-primary rounded px-1 py-0.5"
								value={state.facetSel[k]}
								onChange={(e) =>
									setState((p) => ({
										...p,
										facetSel: { ...p.facetSel, [k]: e.target.value }
									}))
								}
							>
								<option value={ALL}>all</option>
								{cls.values[k].map((v) => (
									<option key={v} value={v}>
										{v}
									</option>
								))}
							</select>
						</label>
					))}
				</div>
			) : null}

			{/* Matrix */}
			{!canRender ? (
				<div className="p-3 text-xs text-text-menu">
					Assign at least one parameter to Rows and one to Columns.
				</div>
			) : state.facetMode === 'trellis' && state.facets.length ? (
				<div className="flex flex-wrap gap-4">
					{combos(state.facets, cls.values).map((ft) => {
						const visible = iterations.filter((it) =>
							state.facets.every((k, i) => it.params[k] === ft[i])
						);
						return (
							<div
								key={ft.join('¦')}
								className="border border-border-primary rounded-md p-2"
							>
								<div className="mb-1.5 text-xs text-text-menu">
									{state.facets.map((k, i) => `${k}=${ft[i]}`).join(' · ')}
								</div>
								<MatrixTable
									iterations={iterations}
									visible={visible}
									rowKeys={state.rows}
									colKeys={state.cols}
									values={cls.values}
									mode={state.mode}
									margins={state.margins}
								/>
							</div>
						);
					})}
				</div>
			) : (
				<MatrixTable
					iterations={iterations}
					visible={iterations.filter(facetFilter)}
					rowKeys={state.rows}
					colKeys={state.cols}
					values={cls.values}
					mode={state.mode}
					margins={state.margins}
				/>
			)}

			<MatrixLegend mode={state.mode} />
		</div>
	);
}

function MatrixLegend({ mode }: { mode: CellMode }) {
	if (mode === 'result') {
		return (
			<div className="flex flex-wrap items-center gap-2 text-[11px] text-text-menu">
				<i className="inline-block w-4 h-3 bg-[#3f7d54]/90" /> pass
				<i className="inline-block w-4 h-3 bg-[#d9d3c4]" /> skip
				<i className="inline-block w-4 h-3 bg-[#b8501f]/90" /> NOK
				<i className="inline-block w-4 h-3 bg-[#e9e2d2]" /> n/a
			</div>
		);
	}
	return (
		<div className="flex flex-wrap items-center gap-2 text-[11px] text-text-menu">
			<i className="inline-block w-4 h-3 bg-[#dfe7df]" />
			<i className="inline-block w-4 h-3 bg-[#a9c7ba]" />
			<i className="inline-block w-4 h-3 bg-[#5f9c8a]" />
			<i className="inline-block w-4 h-3 bg-[#2f7361]" /> iterations →
			<span className="ml-2">· untested (exists elsewhere)</span>
			<i className="inline-block w-4 h-3 bg-[#e9e2d2] ml-2" /> n/a (not
			observed)
		</div>
	);
}
