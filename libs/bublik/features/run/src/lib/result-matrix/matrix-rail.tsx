/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { ButtonTw, Icon, Tooltip, cn } from '@/shared/tailwind-ui';

import { JoinedToggleGroup } from '../joined-toggle-group';
import { MatrixSuggestion, ParamClassification } from './matrix-analysis';
import {
	MatrixFacetMode,
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
	onFacetModeChange: (facetMode: MatrixFacetMode) => void;
	onApplySuggestion: (suggestion: MatrixSuggestion) => void;
	onReset: () => void;
}

function SectionTitle(props: { children: string; action?: ReactNode }) {
	return (
		<div className="mb-2 flex h-[26px] items-center justify-between gap-2">
			<h4 className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-menu">
				{props.children}
			</h4>
			{props.action}
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
		onFacetModeChange,
		onApplySuggestion,
		onReset
	} = props;
	const { varying, fixed, values } = classification;

	return (
		<aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-border-primary p-4">
			<section>
				<SectionTitle
					action={
						<Tooltip content="Reset the matrix layout to the default">
							<ButtonTw variant="secondary" size="xss" onClick={onReset}>
								<Icon
									name="Refresh"
									size={18}
									className="mr-1.5"
									style={{ transform: 'scaleX(-1)' }}
								/>
								Reset layout
							</ButtonTw>
						</Tooltip>
					}
				>
					Suggested
				</SectionTitle>
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
								items={[
									{ value: 'rows', label: 'R', tooltip: 'Rows' },
									{ value: 'cols', label: 'C', tooltip: 'Columns' },
									{ value: 'facets', label: 'F', tooltip: 'Facet' },
									{ value: 'unused', label: '—', tooltip: 'Not used' }
								]}
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

			{state.facets.length ? (
				<section>
					<SectionTitle>Facets</SectionTitle>
					<JoinedToggleGroup<MatrixFacetMode>
						aria-label="Facet mode"
						value={state.facetMode}
						onChange={onFacetModeChange}
						items={[
							{ value: 'filter', label: 'Filter', tooltip: 'Pick one value' },
							{
								value: 'trellis',
								label: 'Small multiples',
								tooltip: 'One matrix per facet value'
							}
						]}
					/>
				</section>
			) : null}
		</aside>
	);
}
