/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useRef } from 'react';

import { config } from '@/bublik/config';
import { ResultIssueBadges } from '@/bublik/features/result-classification';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	Badge,
	DialogClose,
	DrawerContent,
	DrawerRoot,
	Icon,
	Separator,
	VerdictList
} from '@/shared/tailwind-ui';
import { joinKeyValue } from '@/shared/utils';

import { MatrixIteration } from './matrix-analysis';

const MUTED =
	'text-[0.6875rem] font-semibold leading-[0.875rem] text-text-menu whitespace-nowrap';

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

/**
 * Side drawer with the iterations of one matrix cell: their links, results
 * and stamps, and the parameters that differ between them.
 */
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

	const delimiter = config.keyValueDisplayDelimiter;
	const closeRef = useRef<HTMLButtonElement>(null);
	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			{/* The run table's root is `isolate`, so inline the overlay would only
			    compete within the table and the app sidebar would stay on top. */}
			<DrawerContent
				portal
				className="flex h-full w-screen max-w-[40rem] flex-col"
				aria-label="Selected Cell"
				// Focus the close button, not the first control in the header.
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					closeRef.current?.focus();
				}}
			>
				{/* The cell's axis values as badges ("rows × cols"), then the
				    iteration count; wraps when there are many axes. */}
				<div className="flex shrink-0 items-start justify-between gap-2 border-b border-border-primary px-4 py-2">
					<div className="flex min-h-[1.375rem] min-w-0 flex-wrap items-center gap-1.5">
						{rowKeys.map((k, i) => (
							<Badge key={`r-${k}`} className="bg-badge-1">
								{joinKeyValue(k, rowTuple[i], delimiter)}
							</Badge>
						))}
						<span className={MUTED}>×</span>
						{colKeys.map((k, i) => (
							<Badge key={`c-${k}`} className="bg-badge-1">
								{joinKeyValue(k, colTuple[i], delimiter)}
							</Badge>
						))}
						<Separator orientation="vertical" className="mx-1 h-4" />
						<span className={MUTED}>
							{iterations.length}{' '}
							{iterations.length === 1 ? 'iteration' : 'iterations'}
							{facetLabel ? ` · ${facetLabel}` : ''}
						</span>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<DialogClose asChild>
							<button
								ref={closeRef}
								type="button"
								aria-label="Close"
								className="rounded p-1 text-text-menu hover:bg-primary-wash hover:text-primary"
							>
								<Icon name="Cross" className="size-3.5" />
							</button>
						</DialogClose>
					</div>
				</div>
				<ul className="styled-scrollbar flex flex-1 flex-col gap-2 overflow-auto p-4">
					{iterations.map((it) => {
						return (
							<li
								key={it.resultId}
								className="flex items-start gap-4 rounded-md bg-primary-wash p-3"
							>
								{/* The links in a column on the left, as the list's Actions
							    column has them. */}
								<div className="flex shrink-0 flex-col items-start gap-2">
									<ResultLinksContainer
										runId={String(it.source.run_id)}
										resultId={it.resultId}
										result={it.source}
										showLinkToRun={showLinkToRun}
										path={path}
									/>
								</div>
								{/* The result, its stamps under it, as the list's Obtained
							    Result column has them, then what differs. */}
								<div className="flex min-w-0 flex-1 flex-col gap-1.5">
									<VerdictList
										variant="obtained"
										verdicts={it.source.obtained_result.verdicts ?? []}
										result={it.source.obtained_result.result_type}
										isNotExpected={it.hasError}
									/>
									<ResultIssueBadges issues={it.source.issues} withSeparator />
									{differing.length ? (
										<ul className="flex flex-wrap gap-1">
											{differing.map((k) => (
												<Badge key={k} className="bg-badge-1">
													{k}: {it.params[k]}
												</Badge>
											))}
										</ul>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
			</DrawerContent>
		</DrawerRoot>
	);
}
