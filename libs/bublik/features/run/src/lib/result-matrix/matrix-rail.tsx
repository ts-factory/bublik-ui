/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useRef } from 'react';

import { useIsSticky } from '@/shared/hooks';
import { SegmentedTabItem, SegmentedTabs, cn } from '@/shared/tailwind-ui';

import {
	MatrixLayout,
	MatrixSuggestion,
	ParamClassification
} from './matrix-analysis';
import {
	MatrixRole,
	MatrixState,
	isLayoutApplied,
	roleOf
} from './result-view.hooks';

export interface MatrixRailProps {
	classification: ParamClassification;
	suggestions: MatrixSuggestion[];
	state: MatrixState;
	onRoleChange: (param: string, role: MatrixRole) => void;
	/** Sticky offset from the top of the viewport. */
	top: number;
	onApplySuggestion: (suggestion: MatrixSuggestion) => void;
	className?: string;
}

/** Spelled out, as the first version of the matrix had them. */
const ROLE_ITEMS: SegmentedTabItem<MatrixRole>[] = [
	{ value: 'rows', label: 'Rows' },
	{ value: 'cols', label: 'Cols' },
	{ value: 'facets', label: 'Facet' },
	{ value: 'unused', label: '—', tooltip: 'Not used' }
];

const TITLE =
	'text-[0.625rem] font-semibold uppercase tracking-wide text-text-menu';

/** Height of the rail header, matching the matrix content header. */
export const RAIL_HEADER_HEIGHT = 36;

function SectionTitle(props: { children: string }) {
	return <h4 className={cn(TITLE, 'mb-0.5')}>{props.children}</h4>;
}

/** Rows ▸ nested rows × cols, as the matrix lays them out. */
function layoutAxes(layout: MatrixLayout): string {
	return `${layout.rows.join(' ▸ ')} × ${layout.cols.join(' ▸ ')}`;
}

/** Left-rail configuration: suggestions apply with one click, every parameter has a role. */
export function MatrixRail(props: MatrixRailProps) {
	const {
		classification,
		suggestions,
		state,
		onRoleChange,
		top,
		onApplySuggestion,
		className
	} = props;
	const { varying, fixed, values } = classification;
	// The header, not the rail: the rail is as tall as the viewport allows,
	// so it never sits wholly inside the observed area.
	const headerRef = useRef<HTMLDivElement>(null);
	const { isSticky } = useIsSticky(headerRef, { offset: -(top + 1) });

	return (
		<aside
			className={cn(
				'sticky flex w-[260px] flex-col',
				className,
				// Stuck under the filter row, the card's top meets it square.
				isSticky && 'rounded-t-none'
			)}
			style={{ top, maxHeight: `calc(100vh - ${top}px)` }}
		>
			{/* Same height and border as the matrix card's header beside it, so
			    the two line up across the gap. Sticky in its own right too: when
			    the matrix is shorter than the rail, the rail has no room to stick,
			    and the header still stays beside the matrix header. Under the
			    filter bar (z-10), like the matrix header. */}
			<div
				ref={headerRef}
				className={cn(
					'sticky z-[5] flex shrink-0 items-center border-b border-border-primary bg-bg-primary px-3',
					!isSticky && 'rounded-t-lg'
				)}
				style={{ top, height: RAIL_HEADER_HEIGHT }}
			>
				<h4 className={TITLE}>Suggested</h4>
			</div>
			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-3 py-3">
				<section>
					{suggestions.length ? (
						<ul className="flex flex-col gap-1">
							{suggestions.map((s) => {
								const applied = isLayoutApplied(state, s);

								return (
									<li key={s.id}>
										{/* The axes and the rationale are spelled out under the
										    name, wrapping rather than truncated, so the choice can
										    be made without hovering each one. */}
										<button
											type="button"
											onClick={() => onApplySuggestion(s)}
											className={cn(
												'flex w-full flex-col gap-0.5 rounded-md border px-2 py-1 text-left transition-colors',
												applied
													? 'border-primary bg-primary-wash'
													: 'border-border-primary bg-bg-primary hover:bg-primary-wash'
											)}
										>
											<span className="flex w-full items-center justify-between gap-2">
												<span className="truncate text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary">
													{s.label}
												</span>
												<span
													className={cn(
														'shrink-0 text-[0.6875rem] leading-[0.875rem]',
														applied ? 'text-primary' : 'text-text-menu'
													)}
												>
													{s.score}
													{applied ? ' · applied' : ''}
												</span>
											</span>
											<span className="break-words text-[0.6875rem] font-medium leading-[0.875rem] text-text-primary">
												{layoutAxes(s)}
											</span>
											<span className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
												{s.rationale}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					) : (
						<p className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
							No suggestions for this test.
						</p>
					)}
				</section>

				<section>
					<SectionTitle>Parameters</SectionTitle>
					<ul className="flex flex-col">
						{varying.map((param) => (
							<li
								key={param}
								className="flex flex-col gap-1 border-b border-border-primary py-1.5 first:pt-0 last:border-b-0"
							>
								{/* Name and count on one line, the role tabs under them: the
								    spelled-out roles need the rail's full width. */}
								<div className="flex min-w-0 items-baseline justify-between gap-2">
									<span
										className="truncate text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary"
										title={param}
									>
										{param}
									</span>
									<span className="shrink-0 text-[0.6875rem] leading-[0.875rem] text-text-menu">
										{values[param].length} values
									</span>
								</div>
								<SegmentedTabs<MatrixRole>
									aria-label={`Role of ${param}`}
									value={roleOf(state, param)}
									onChange={(role) => onRoleChange(param, role)}
									items={ROLE_ITEMS}
								/>
							</li>
						))}
						{fixed.map((f) => (
							<li
								key={f.name}
								className="flex items-center justify-between gap-2 border-b border-border-primary py-1.5 opacity-60 last:border-b-0"
							>
								<div className="min-w-0">
									<div
										className="truncate text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary"
										title={f.name}
									>
										{f.name}
									</div>
									<div
										className="truncate text-[0.6875rem] leading-[0.875rem] text-text-menu"
										title={f.value}
									>
										{f.value} · 1 value
									</div>
								</div>
								<span className="shrink-0 rounded border border-border-primary px-1.5 py-[3px] text-[0.625rem] font-semibold uppercase tracking-wide leading-[0.875rem] text-text-menu">
									fixed
								</span>
							</li>
						))}
					</ul>
				</section>
			</div>
		</aside>
	);
}
