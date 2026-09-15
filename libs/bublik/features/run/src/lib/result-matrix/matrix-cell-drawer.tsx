/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	Badge,
	CardHeader,
	DialogClose,
	DrawerContent,
	DrawerRoot,
	Icon,
	VerdictList
} from '@/shared/tailwind-ui';

import { MatrixIteration } from './matrix-analysis';

export interface MatrixCellDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	rowKeys: string[];
	colKeys: string[];
	rowTuple: string[];
	colTuple: string[];
	/** Facet values of the small multiple the cell belongs to, if any. */
	facetLabel?: string;
	iterations: MatrixIteration[];
	showLinkToRun?: boolean;
	path?: string;
}

/** Side drawer with the iterations of one matrix cell and their links. */
export function MatrixCellDrawer(props: MatrixCellDrawerProps) {
	const {
		open,
		onOpenChange,
		rowKeys,
		colKeys,
		rowTuple,
		colTuple,
		facetLabel,
		iterations,
		showLinkToRun,
		path
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
		return Object.entries(seen)
			.filter(([, values]) => values.size > 1)
			.map(([k]) => k);
	}, [iterations, rowKeys, colKeys]);

	const title = [
		...rowKeys.map((k, i) => `${k} = ${rowTuple[i]}`),
		...colKeys.map((k, i) => `${k} = ${colTuple[i]}`)
	].join(' × ');

	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				className="flex h-full w-screen max-w-[40rem] flex-col"
				aria-label="Selected cell"
			>
				<CardHeader label="Selected cell">
					<DialogClose asChild>
						<button
							type="button"
							aria-label="Close"
							className="rounded p-2 text-text-menu hover:bg-primary-wash hover:text-primary"
						>
							<Icon name="Cross" className="size-4" />
						</button>
					</DialogClose>
				</CardHeader>
				<div className="border-b border-border-primary px-4 py-3">
					<div className="text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary">
						{title}
					</div>
					<div className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
						{iterations.length}{' '}
						{iterations.length === 1 ? 'iteration' : 'iterations'}
						{facetLabel ? ` · ${facetLabel}` : ''}
					</div>
				</div>
				<ul className="styled-scrollbar flex flex-1 flex-col gap-2 overflow-auto p-4">
					{iterations.map((it) => (
						<li
							key={it.resultId}
							className="flex flex-col gap-2 rounded-md bg-primary-wash p-3"
						>
							<VerdictList
								variant="obtained"
								verdicts={it.source.obtained_result.verdicts ?? []}
								result={it.source.obtained_result.result_type}
								isNotExpected={it.hasError}
							/>
							{differing.length ? (
								<ul className="flex flex-wrap gap-1">
									{differing.map((k) => (
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
			</DrawerContent>
		</DrawerRoot>
	);
}
