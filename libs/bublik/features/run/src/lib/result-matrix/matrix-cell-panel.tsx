/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

import { ResultLinksContainer } from '@/bublik/features/result-links';
import { Badge, ButtonTw, Icon, VerdictList } from '@/shared/tailwind-ui';

import { MatrixIteration } from './matrix-analysis';

export interface MatrixCellPanelProps {
	rowKeys: string[];
	colKeys: string[];
	rowTuple: string[];
	colTuple: string[];
	/** Facet values of the small multiple the cell belongs to, if any. */
	facetLabel?: string;
	iterations: MatrixIteration[];
	showLinkToRun?: boolean;
	path?: string;
	onClose: () => void;
}

/** Details and links for the iterations of one matrix cell. */
export function MatrixCellPanel(props: MatrixCellPanelProps) {
	const {
		rowKeys,
		colKeys,
		rowTuple,
		colTuple,
		facetLabel,
		iterations,
		showLinkToRun,
		path,
		onClose
	} = props;

	// Parameters that differ between the iterations of this cell (the axes
	// are the same for all of them by construction).
	const differing = useMemo(() => {
		const axes = new Set([...rowKeys, ...colKeys]);
		const seen: Record<string, Set<string>> = {};
		for (const it of iterations) {
			for (const [k, v] of Object.entries(it.params)) {
				if (axes.has(k)) continue;
				(seen[k] ??= new Set()).add(v);
			}
		}
		return new Set(
			Object.entries(seen)
				.filter(([, values]) => values.size > 1)
				.map(([k]) => k)
		);
	}, [iterations, rowKeys, colKeys]);

	const title = [
		...rowKeys.map((k, i) => `${k} ${rowTuple[i]}`),
		...colKeys.map((k, i) => `${k} ${colTuple[i]}`)
	].join(' × ');

	return (
		<aside className="flex w-[360px] max-w-full shrink-0 flex-col gap-3 rounded-md border border-border-primary bg-white p-3">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-menu">
						Selected cell
					</div>
					<div className="text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary">
						{title}
					</div>
					<div className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
						{iterations.length}{' '}
						{iterations.length === 1 ? 'iteration' : 'iterations'}
						{facetLabel ? ` · ${facetLabel}` : ''}
					</div>
				</div>
				<ButtonTw
					variant="secondary"
					size="xss"
					aria-label="Close selected cell"
					onClick={onClose}
				>
					<Icon name="CrossSimple" size={16} />
				</ButtonTw>
			</div>
			<ul className="flex flex-col gap-2">
				{iterations.map((it) => (
					<li
						key={it.resultId}
						className="flex flex-col gap-2 rounded-md bg-primary-wash p-2"
					>
						<VerdictList
							variant="obtained"
							verdicts={it.source.obtained_result.verdicts ?? []}
							result={it.source.obtained_result.result_type}
							isNotExpected={it.hasError}
						/>
						{differing.size ? (
							<ul className="flex flex-wrap gap-1">
								{[...differing].map((k) => (
									<Badge key={k} className="bg-badge-1">
										{k}: {it.params[k] ?? '—'}
									</Badge>
								))}
							</ul>
						) : null}
						<ResultLinksContainer
							runId={String(it.source.run_id)}
							resultId={it.resultId}
							result={it.source}
							showLinkToRun={showLinkToRun}
							path={path}
							direction="row"
						/>
					</li>
				))}
			</ul>
		</aside>
	);
}
