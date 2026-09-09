/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { cn } from '@/shared/tailwind-ui';

import {
	MatrixIteration,
	ParamClassification,
	combos,
	matchTuple,
	presenceSet
} from './matrix-analysis';

export type CellMode = 'coverage' | 'result';

export interface MatrixTableProps {
	iterations: MatrixIteration[];
	/** Iterations after facet filtering (what the cells count). */
	visible: MatrixIteration[];
	rowKeys: string[];
	colKeys: string[];
	values: ParamClassification['values'];
	mode: CellMode;
	margins: boolean;
	onCellClick?: (iters: MatrixIteration[]) => void;
}

const COVERAGE = [
	'bg-[#dfe7df]',
	'bg-[#a9c7ba]',
	'bg-[#5f9c8a] text-white',
	'bg-[#2f7361] text-white'
];

function product(
	values: ParamClassification['values'],
	keys: string[],
	upto: number
) {
	let p = 1;
	for (let x = 0; x <= upto; x++) p *= values[keys[x]].length;
	return p;
}

function Cell(props: {
	iters: MatrixIteration[];
	present: boolean;
	mode: CellMode;
	onClick?: () => void;
}) {
	const { iters, present, mode, onClick } = props;
	if (!iters.length) {
		return present ? (
			<td className="border border-border-primary text-border-primary text-center align-middle">
				·
			</td>
		) : (
			<td
				title="not observed in any iteration (structural / N/A)"
				className="border border-border-primary text-center align-middle text-[9px] text-[#b3a98f]"
				style={{
					backgroundImage:
						'repeating-linear-gradient(45deg,#e9e2d2,#e9e2d2 5px,#efe9db 5px,#efe9db 10px)'
				}}
			/>
		);
	}
	let cls = '';
	let title = `${iters.length} iteration(s)`;
	if (mode === 'coverage') {
		cls = COVERAGE[Math.min(COVERAGE.length - 1, iters.length - 1)];
	} else {
		const nok = iters.filter((i) => i.hasError).length;
		const skip = iters.filter((i) => i.resultType === 'SKIPPED').length;
		cls = nok
			? 'bg-[#b8501f]/90 text-white'
			: skip
			? 'bg-[#d9d3c4]'
			: 'bg-[#3f7d54]/90 text-white';
		title = `${iters.length} iters · ${nok} NOK`;
	}
	return (
		<td
			title={title}
			onClick={onClick}
			className={cn(
				'border border-border-primary text-center align-middle font-medium cursor-pointer',
				cls
			)}
		>
			{iters.length}
		</td>
	);
}

export function MatrixTable(props: MatrixTableProps) {
	const { iterations, visible, rowKeys, colKeys, values, mode, margins } =
		props;
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
					className="border border-border-primary bg-gray-50 px-2 py-1 text-[9px] uppercase tracking-wide text-text-menu text-right"
				>
					{rowKeys.join(' ▸ ')} \ {colKeys.join(' ▸ ')}
				</th>
			);
		}
		const per = cTuples.length / product(values, colKeys, ci);
		let last: string | null = null;
		cTuples.forEach((t, ti) => {
			const prefix = t.slice(0, ci + 1).join('¦');
			if (prefix !== last) {
				last = prefix;
				cells.push(
					<th
						key={`c-${ci}-${ti}`}
						colSpan={per}
						className="border border-border-primary bg-gray-50 px-2 py-1 text-xs font-medium"
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
					className="border border-border-primary bg-[#efeadd] px-2 py-1 font-bold"
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
						className="border border-border-primary bg-gray-50 px-2 py-1 text-xs font-medium whitespace-nowrap text-right"
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
			const isPresent = present.has([...rt, ...ct].join('¦'));
			return (
				<Cell
					key={`cell-${ci}`}
					iters={iters}
					present={isPresent}
					mode={mode}
					onClick={
						iters.length && props.onCellClick
							? () => props.onCellClick?.(iters)
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
					<td className="border border-border-primary bg-[#efeadd] text-center font-bold">
						{rowTotal}
					</td>
				) : null}
			</tr>
		);
	});

	return (
		<div className="overflow-auto">
			<table className="border-collapse text-xs [&_td]:h-10 [&_td]:w-[52px]">
				<thead>{headRows}</thead>
				<tbody>
					{bodyRows}
					{margins ? (
						<tr>
							<th
								colSpan={rowKeys.length}
								className="border border-border-primary bg-[#efeadd] px-2 py-1 font-bold text-right"
							>
								Σ
							</th>
							{colTotals.map((t, i) => (
								<td
									key={`ct-${i}`}
									className="border border-border-primary bg-[#efeadd] text-center font-bold"
								>
									{t}
								</td>
							))}
							<td className="border border-border-primary bg-[#efeadd] text-center font-bold">
								{grand}
							</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}
