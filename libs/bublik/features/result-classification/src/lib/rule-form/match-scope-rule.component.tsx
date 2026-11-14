/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { RefObject } from 'react';

import type { ClassifyRuleOptions } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	Icon,
	IconButton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import {
	ScopeValuePicker,
	type ScopeValueStyle
} from '../pickers/scope-value-picker.component';
import { VerdictLists } from '../pickers/verdict-lists.component';
import { MATCH_SCOPE_COPY } from './match-scope.copy';
import { MATCHER_HINTS } from './matcher-fields.utils';
import {
	clearRulePicks,
	parameterOptions,
	parametersPicked,
	resetRulePicks,
	ruleStanding,
	rulesOf,
	setRulePick,
	tagOptions,
	tagsPicked,
	verdictsKept,
	type RuleStanding,
	type ScopeOption,
	type ScopePicks
} from './match-scope.utils';

/** The chip styling the parameters already have in the rules table. */
const PARAMETER_STYLE: ScopeValueStyle = {
	variant: BadgeVariants.Primary,
	className: 'bg-badge-1'
};

/** The tags tell the runs' important ones from their relevant ones. */
function tagStyle(option: ScopeOption): ScopeValueStyle {
	return {
		variant: BadgeVariants.Primary,
		className: option.important ? 'bg-badge-6' : 'bg-badge-0'
	};
}

/**
 * The scale of the result table's small uppercase chips, a notch under the
 * classification meta badge: these sit on a card's border beside its title.
 */
const SMALL_CHIP_CLASS =
	'px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem]';

interface PicksProps {
	picks: ScopePicks;
	setPicks: (next: ScopePicks) => void;
	container?: RefObject<HTMLElement>;
}

/** A test path: package dimmed, the test itself in bold; `hint` on hover. */
function TestTitle({ path, hint }: { path: string; hint: string }) {
	const slash = path.lastIndexOf('/');

	return (
		<Tooltip content={hint}>
			<span
				className="min-w-0 truncate text-[0.8125rem] leading-5 text-text-secondary"
				data-testid="match-scope-test-path"
			>
				<span className="text-text-menu">{path.slice(0, slash + 1)}</span>
				<span className="font-semibold">{path.slice(slash + 1)}</span>
			</span>
		</Tooltip>
	);
}

/**
 * The warning badge of a rule wider than it may seem, with the reason on
 * hover; none when the rule is narrowed.
 */
function StandingBadge({ standing }: { standing: RuleStanding }) {
	if (!standing.warnings.length) return null;

	return (
		<Tooltip content={standing.warnings.join(' ')}>
			<Badge
				as="span"
				isInteractive={false}
				variant={BadgeVariants.Warning}
				className={cn(SMALL_CHIP_CLASS, 'gap-1 shrink-0')}
				data-testid="match-scope-standing"
			>
				<Icon
					name="TriangleExclamationMark"
					size={10}
					className="text-bg-warning"
				/>
				{standing.pathOnly ? 'path only' : `any ${standing.open.join(', ')}`}
			</Badge>
		</Tooltip>
	);
}

/** What a rule covers and where it stands: its warning, its counts. */
function RuleBadges({
	rule,
	merged,
	picks
}: {
	rule: ClassifyRuleOptions;
	/** The rule matches on what an earlier one does: stored as one with it. */
	merged: boolean;
	picks: ScopePicks;
}) {
	const results = rule.result_ids.length;
	const stored = rulesOf(rule, picks);

	return (
		<>
			<StandingBadge standing={ruleStanding(rule, picks)} />
			{merged ? (
				<Tooltip content="Matches on the same values as a rule above: the two are stored as one.">
					<Badge
						as="span"
						isInteractive={false}
						variant={BadgeVariants.Info}
						className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
						data-testid="match-scope-merged"
					>
						same as above
					</Badge>
				</Tooltip>
			) : null}
			{stored > 1 ? (
				<Tooltip content="A rule is stored for each verdict list kept.">
					<Badge
						as="span"
						isInteractive={false}
						variant={BadgeVariants.Info}
						className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
						data-testid="match-scope-rules"
					>
						{stored} rules
					</Badge>
				</Tooltip>
			) : null}
			<Badge
				as="span"
				isInteractive={false}
				variant={BadgeVariants.Info}
				className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
				data-testid="match-scope-results"
			>
				{results} result{results > 1 ? 's' : ''}
			</Badge>
		</>
	);
}

/** A rule's own reset and bin. */
function RuleActions({
	rule,
	picks,
	setPicks
}: { rule: ClassifyRuleOptions } & PicksProps) {
	return (
		<>
			<IconButton
				name="Refresh"
				size={16}
				helpMessage="This rule back to everything its results have"
				onClick={() => setPicks(resetRulePicks(picks, rule))}
				className="!h-[22px] !w-[22px] -scale-x-100"
			/>
			<IconButton
				name="Bin"
				size={14}
				helpMessage="Empty this rule: match on its path alone"
				onClick={() => setPicks(clearRulePicks(picks, rule))}
				className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
			/>
		</>
	);
}

/** A rule's fields, as the rest of the form has its inputs. */
function RuleFields({
	rule,
	picks,
	setPicks,
	container
}: { rule: ClassifyRuleOptions } & PicksProps) {
	const results = rule.result_ids.length;

	return (
		<div className="flex flex-col gap-5">
			<ScopeValuePicker
				label="Tags"
				hint={MATCHER_HINTS.tags}
				options={tagOptions(rule)}
				value={tagsPicked(rule, picks)}
				onChange={(next) => setPicks(setRulePick(picks, rule, { tags: next }))}
				styleOf={tagStyle}
				emptyText={
					rule.run_ids.length > 1 ? 'none on these runs' : 'none on this run'
				}
				container={container}
				testId="match-scope-tags"
			/>
			<ScopeValuePicker
				label="Parameters"
				hint={MATCHER_HINTS.parameters}
				options={parameterOptions(rule)}
				value={parametersPicked(rule, picks)}
				onChange={(next) =>
					setPicks(setRulePick(picks, rule, { parameters: next }))
				}
				styleOf={() => PARAMETER_STYLE}
				emptyText={
					results > 1 ? 'none shared by these results' : 'none on this result'
				}
				container={container}
				testId="match-scope-parameters"
			/>
			<VerdictLists
				hint={MATCH_SCOPE_COPY.verdictsHint}
				lists={rule.verdicts}
				kept={verdictsKept(rule, picks)}
				onChange={(kept) =>
					setPicks(setRulePick(picks, rule, { verdicts: kept }))
				}
				testId="match-scope-verdicts"
			/>
		</div>
	);
}

export { RuleActions, RuleBadges, RuleFields, SMALL_CHIP_CLASS, TestTitle };
export type { PicksProps };
