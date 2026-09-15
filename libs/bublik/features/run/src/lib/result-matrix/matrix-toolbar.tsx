/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	Badge,
	ButtonTw,
	DropdownMenuCheckboxItem,
	DropdownMenuItem,
	DropdownMenuLabel,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';

import { JoinedToggleGroup } from '../joined-toggle-group';
import { MatrixSuggestion, ParamClassification } from './matrix-analysis';
import { ChipMenu } from './matrix-chip-menu';
import {
	MatrixFacetMode,
	MatrixRole,
	MatrixState,
	isLayoutApplied,
	roleOf
} from './result-view.hooks';

export interface MatrixToolbarProps {
	classification: ParamClassification;
	suggestions: MatrixSuggestion[];
	state: MatrixState;
	onRoleChange: (param: string, role: MatrixRole) => void;
	onSwapAxes: () => void;
	onFacetModeChange: (facetMode: MatrixFacetMode) => void;
	onApplySuggestion: (suggestion: MatrixSuggestion) => void;
	onReset: () => void;
}

interface AxisMenuProps {
	prefix: string;
	axis: Exclude<MatrixRole, 'unused'>;
	classification: ParamClassification;
	state: MatrixState;
	onRoleChange: (param: string, role: MatrixRole) => void;
}

function AxisMenu(props: AxisMenuProps) {
	const { prefix, axis, classification, state, onRoleChange } = props;
	const { varying, values } = classification;
	const chosen = state[axis];

	const label = chosen.length ? (
		<span className="flex items-center gap-1">
			{chosen.map((param, idx) => (
				<span key={param} className="flex items-center gap-1">
					{idx > 0 ? <span className="text-text-menu">▸</span> : null}
					<span>{param}</span>
					<span className="text-primary">×{values[param].length}</span>
				</span>
			))}
		</span>
	) : (
		'none'
	);

	return (
		<ChipMenu prefix={prefix} label={label} dashed={!chosen.length}>
			<DropdownMenuLabel className="text-[0.625rem] uppercase tracking-wide text-text-menu">
				{prefix}
			</DropdownMenuLabel>
			{varying.map((param) => {
				const current = roleOf(state, param);
				const checked = current === axis;

				return (
					<DropdownMenuCheckboxItem
						key={param}
						checked={checked}
						onSelect={(event) => event.preventDefault()}
						onCheckedChange={(next) =>
							onRoleChange(param, next ? axis : 'unused')
						}
					>
						<span className="flex w-full items-center justify-between gap-3">
							<span>{param}</span>
							<span className="text-[0.6875rem] text-text-menu">
								×{values[param].length}
								{!checked && current !== 'unused' ? ` · ${current}` : ''}
							</span>
						</span>
					</DropdownMenuCheckboxItem>
				);
			})}
		</ChipMenu>
	);
}

/** One-line configuration: Rows × Cols as a sentence, suggestions behind a dropdown. */
export function MatrixToolbar(props: MatrixToolbarProps) {
	const {
		classification,
		suggestions,
		state,
		onRoleChange,
		onSwapAxes,
		onFacetModeChange,
		onApplySuggestion,
		onReset
	} = props;

	return (
		<div className="flex flex-col gap-2 border-b border-border-primary px-4 py-2">
			<div className="flex flex-wrap items-center gap-2">
				<AxisMenu
					prefix="Rows"
					axis="rows"
					classification={classification}
					state={state}
					onRoleChange={onRoleChange}
				/>
				<Tooltip content="Swap rows and columns">
					<ButtonTw
						variant="outline-secondary"
						size="xss"
						aria-label="Swap rows and columns"
						onClick={onSwapAxes}
					>
						<Icon name="SwapArrows" size={16} />
					</ButtonTw>
				</Tooltip>
				<AxisMenu
					prefix="Cols"
					axis="cols"
					classification={classification}
					state={state}
					onRoleChange={onRoleChange}
				/>
				<AxisMenu
					prefix="Facet"
					axis="facets"
					classification={classification}
					state={state}
					onRoleChange={onRoleChange}
				/>
				{state.facets.length ? (
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
				) : null}
				<Separator orientation="vertical" className="mx-1 h-5" />
				{suggestions.length ? (
					<ChipMenu label="✦ Suggested layouts">
						{suggestions.map((s) => (
							<DropdownMenuItem
								key={s.id}
								onSelect={() => onApplySuggestion(s)}
								title={s.rationale}
							>
								<span className="flex w-full items-center justify-between gap-3">
									<span>{s.label}</span>
									<span className="text-[0.6875rem] text-text-menu">
										{s.score}
										{isLayoutApplied(state, s) ? ' · applied' : ''}
									</span>
								</span>
							</DropdownMenuItem>
						))}
					</ChipMenu>
				) : null}
				<Tooltip content="Reset the matrix layout">
					<ButtonTw variant="secondary" size="xss" onClick={onReset}>
						<Icon
							name="Refresh"
							size={18}
							className="mr-1.5"
							style={{ transform: 'scaleX(-1)' }}
						/>
						Reset
					</ButtonTw>
				</Tooltip>
			</div>
			{classification.fixed.length ? (
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-[0.6875rem] font-semibold leading-[0.875rem] uppercase tracking-wide text-text-menu">
						Fixed
					</span>
					{classification.fixed.map((f) => (
						<Badge key={f.name} className="bg-badge-1">
							{f.name}: {f.value}
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}
