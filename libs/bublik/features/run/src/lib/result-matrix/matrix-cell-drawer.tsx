/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEvent, useMemo, useRef } from 'react';

import { config } from '@/bublik/config';
import {
	ClassifySelectionButton,
	ResultIssueBadges,
	ResultSelection,
	isClassifiable,
	useClassifySelection,
	useResultSelection
} from '@/bublik/features/result-classification';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import {
	Badge,
	ButtonTw,
	DialogClose,
	DrawerContent,
	DrawerRoot,
	Icon,
	Separator,
	Tooltip,
	VerdictList,
	cn
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
 * Classify and Reset for the page's result selection, at the foot of the
 * drawer while anything is picked: the selection's pill sits behind the
 * drawer, out of reach. The same action as the pill's popover, so picks
 * from other tests and runs go in the same requests.
 */
function DrawerSelectionFooter({ selection }: { selection: ResultSelection }) {
	const classify = useClassifySelection(selection);

	return (
		<>
			{selection.count ? (
				<div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border-primary px-4 py-3">
					<ClassifySelectionButton trigger={classify.trigger} />
					<ButtonTw
						variant="outline"
						rounded="lg"
						size="sm/2"
						className="w-full justify-center"
						onClick={selection.clear}
					>
						Reset
					</ButtonTw>
				</div>
			) : null}
			{/* Mounted whatever is picked: classifying drops the selection. */}
			{classify.drawer}
		</>
	);
}

/**
 * Side drawer with the iterations of one matrix cell: their links, results
 * and stamps. The failed or classified ones are picked by a click into the
 * page's result selection, as rows of the result table are, and classified
 * from the footer together with whatever else is picked.
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
	// The page's result selection, the one the list's rows pick into; with
	// none, as outside the run pages, the cards are not picked.
	const selection = useResultSelection();
	// What Classify can take: a failure, or a result already stamped.
	const classifiable = useMemo(
		() => iterations.filter((it) => isClassifiable(it.source)),
		[iterations]
	);
	const isAllPicked =
		classifiable.length > 0 &&
		classifiable.every((it) => selection?.isSelected(it.resultId));

	// A click anywhere on a pickable card toggles it, as a list row does,
	// unless it lands on one of the card's own controls or links.
	function handleCardClick(
		event: MouseEvent<HTMLLIElement>,
		iteration: MatrixIteration
	) {
		const target = event.target as HTMLElement;
		// React bubbles through portals: a click in the card's log preview gets
		// here too, though it is nowhere near the card.
		if (!event.currentTarget.contains(target)) return;
		if (target.closest('button, a, input, [role="button"]')) return;
		selection?.toggle(iteration.source);
	}

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
						{/* The result table's Select All, for the cell's iterations. */}
						{selection && classifiable.length > 1 ? (
							<Tooltip
								content={
									isAllPicked
										? 'Drop the listed results from the selection'
										: 'Select every listed failed or classified result to classify them at once'
								}
							>
								<ButtonTw
									variant={isAllPicked ? 'primary' : 'secondary'}
									size="xss"
									aria-pressed={isAllPicked}
									onClick={() =>
										isAllPicked
											? selection.deselect(
													classifiable.map((it) => it.resultId)
											  )
											: selection.select(classifiable.map((it) => it.source))
									}
								>
									<Icon
										name="BoxCheckmark"
										size={20}
										viewBox="1.94 1 14 14"
										className="mr-1.5"
									/>
									Select All
								</ButtonTw>
							</Tooltip>
						) : null}
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
						const isPickable = selection !== null && isClassifiable(it.source);
						const isPicked =
							isPickable && (selection?.isSelected(it.resultId) ?? false);

						return (
							<li
								key={it.resultId}
								onClick={
									isPickable ? (event) => handleCardClick(event, it) : undefined
								}
								// Only a failed or a classified result can be picked, as in
								// the list; a picked one is outlined and tinted, as its row.
								data-selected={isPicked ? '' : undefined}
								className={cn(
									'flex items-start gap-4 rounded-md border bg-primary-wash p-3 transition-colors',
									isPicked
										? 'border-primary bg-primary/10'
										: 'border-transparent',
									isPickable && 'cursor-pointer hover:border-primary'
								)}
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
				{selection ? <DrawerSelectionFooter selection={selection} /> : null}
			</DrawerContent>
		</DrawerRoot>
	);
}
