/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ButtonTw, Icon, Tooltip, cn } from '@/shared/tailwind-ui';

import { JoinedToggleGroup, JoinedToggleItem } from '../joined-toggle-group';
import { MatrixSuggestion, ParamClassification } from './matrix-analysis';
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
	onReset: () => void;
}

// Square, easy-to-hit items (26px like the button height).
const ROLE_CLASS = 'w-[26px] px-0';
const ROLE_ITEMS: JoinedToggleItem<MatrixRole>[] = [
	{ value: 'rows', label: 'R', tooltip: 'Rows', className: ROLE_CLASS },
	{ value: 'cols', label: 'C', tooltip: 'Columns', className: ROLE_CLASS },
	{ value: 'facets', label: 'F', tooltip: 'Facet', className: ROLE_CLASS },
	{ value: 'unused', label: '—', tooltip: 'Not used', className: ROLE_CLASS }
];

const TITLE =
	'text-[0.625rem] font-semibold uppercase tracking-wide text-text-menu';

/** Height of the rail header, matching the matrix content header. */
export const RAIL_HEADER_HEIGHT = 36;

function SectionTitle(props: { children: string }) {
	return (
		<div className="mb-2 flex h-[26px] items-center">
			<h4 className={TITLE}>{props.children}</h4>
		</div>
	);
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
		onReset
	} = props;
	const { varying, fixed, values } = classification;

	return (
		<aside
			className="sticky flex w-[260px] flex-col"
			style={{ top, maxHeight: `calc(100vh - ${top}px)` }}
		>
			{/* Same height and border as the content header next to it, so the
			    two read as one bar across the rail's right border. */}
			<div
				className="flex shrink-0 items-center justify-between gap-2 border-b border-border-primary px-4"
				style={{ height: RAIL_HEADER_HEIGHT }}
			>
				<h4 className={TITLE}>Suggested</h4>
				<Tooltip content="Reset the matrix layout to the default">
					<ButtonTw variant="secondary" size="xss" onClick={onReset}>
						<Icon
							name="Refresh"
							size={18}
							className="mr-1.5"
							style={{ transform: 'scaleX(-1)' }}
						/>
						Reset Layout
					</ButtonTw>
				</Tooltip>
			</div>
			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
				<section>
					{suggestions.length ? (
						<ul className="flex flex-col gap-1.5">
							{suggestions.map((s) => {
								const applied = isLayoutApplied(state, s);

								return (
									<li key={s.id}>
										<button
											type="button"
											onClick={() => onApplySuggestion(s)}
											title={s.rationale}
											className={cn(
												'flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors',
												applied
													? 'border-primary bg-primary-wash'
													: 'border-border-primary bg-white hover:bg-gray-50'
											)}
										>
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
								className="flex items-center justify-between gap-2 border-b border-border-primary py-1.5 last:border-b-0"
							>
								<div className="min-w-0">
									<div
										className="truncate text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary"
										title={param}
									>
										{param}
									</div>
									<div className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
										{values[param].length} values
									</div>
								</div>
								<JoinedToggleGroup<MatrixRole>
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
					<p className="mt-2 text-[0.6875rem] leading-[0.875rem] text-text-menu">
						R rows · C cols · F facet · — not used
					</p>
				</section>
			</div>
		</aside>
	);
}
