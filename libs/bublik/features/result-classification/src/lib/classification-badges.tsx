/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { Badge, Icon, Tooltip, cn } from '@/shared/tailwind-ui';
import type {
	IssueCategory,
	IssueState,
	ResultIssueRef,
	RunIssueRow
} from '@/shared/types';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	type RunIssueEffect,
	RUN_ISSUE_EFFECT_META,
	categoryMeta,
	dispositionMeta,
	formatBugKey,
	issueRulesState,
	issueStateMeta,
	originMeta,
	ruleActiveMeta,
	runIssueEffect
} from './classification-colors';

/**
 * One component per classification axis.
 *
 * Every one of these takes the *domain value* — an `IssueCategory`, an
 * `IssueState`, a tri-state `expected` — and never a colour, a label or a
 * pre-resolved meta object. That is the whole point: the meta maps in
 * `classification-colors.ts` stay the single source of truth, and a call site
 * cannot invent a seventh category chip or style a state badge by hand.
 */

/**
 * `CLASSIFICATION_BADGE_CLASS` without the casing transform — see `BugKeyChip`.
 */
const BUG_KEY_BADGE_CLASS = 'text-[0.6875rem] leading-[1.125rem]';

interface BadgeExtras {
	className?: string;
	/** Renders the filter-selected outline; see `badgeSelectedStyles`. */
	isSelected?: boolean;
	onClick?: () => void;
}

interface MetaBadgeProps extends BadgeExtras {
	description: string;
	/** Applied on top of the Badge base; comes from a meta map. */
	metaClassName?: string;
	children: ReactNode;
	dataAttributes?: Record<string, string>;
}

/** The shared shell: tooltip carries the meaning, badge carries the colour. */
function MetaBadge({
	description,
	metaClassName,
	children,
	dataAttributes,
	className,
	isSelected,
	onClick
}: MetaBadgeProps) {
	return (
		<Tooltip content={description}>
			<Badge
				className={cn(CLASSIFICATION_BADGE_CLASS, metaClassName, className)}
				isSelected={isSelected}
				onClick={onClick}
				{...dataAttributes}
			>
				{children}
			</Badge>
		</Tooltip>
	);
}

export interface CategoryBadgeProps extends BadgeExtras {
	category: IssueCategory;
	/** The long form, for places with room. Defaults to the chip label. */
	long?: boolean;
}

export function CategoryBadge({ category, long, ...rest }: CategoryBadgeProps) {
	const meta = categoryMeta(category);

	return (
		<MetaBadge
			description={meta.description}
			metaClassName={meta.className}
			dataAttributes={{ 'data-category': category }}
			{...rest}
		>
			{long ? meta.displayValue : meta.label}
		</MetaBadge>
	);
}

export interface CategoryBadgeListProps {
	categories: readonly IssueCategory[];
	className?: string;
}

/**
 * A result may be stamped by several of an issue's rules, so the same category
 * legitimately arrives more than once. Dedupe, then order by `CATEGORY_ORDER`
 * so the same set of categories always renders in the same sequence.
 */
export function CategoryBadgeList({
	categories,
	className
}: CategoryBadgeListProps) {
	const unique = Array.from(new Set(categories)).sort(
		(a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
	);

	if (!unique.length) return <span className="text-text-menu">-</span>;

	return (
		<div className={cn('flex flex-wrap items-center gap-1', className)}>
			{unique.map((category) => (
				<CategoryBadge key={category} category={category} />
			))}
		</div>
	);
}

export interface IssueStateBadgeProps extends BadgeExtras {
	state: IssueState;
}

export function IssueStateBadge({ state, ...rest }: IssueStateBadgeProps) {
	const meta = issueStateMeta(state);

	return (
		<MetaBadge
			description={meta.description}
			metaClassName={meta.className}
			dataAttributes={{ 'data-issue-state': state }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface DispositionBadgeProps extends BadgeExtras {
	/** The rule's tri-state flag, or the OR across an issue's rules. */
	expected: boolean | null | undefined;
	/**
	 * Set when the value is an OR across several rules rather than one rule's
	 * own decision, so the tooltip says "at least one rule" instead of "this
	 * rule".
	 */
	aggregate?: boolean;
}

export function DispositionBadge({
	expected,
	aggregate,
	className,
	isSelected,
	onClick
}: DispositionBadgeProps) {
	const meta = dispositionMeta(expected);

	return (
		<Tooltip content={aggregate ? meta.aggregateDescription : meta.description}>
			<Badge
				variant={meta.variant}
				className={cn(CLASSIFICATION_BADGE_CLASS, className)}
				isSelected={isSelected}
				onClick={onClick}
				data-disposition={meta.value}
			>
				{meta.label}
			</Badge>
		</Tooltip>
	);
}

export interface RunEffectBadgeProps extends BadgeExtras {
	effect: RunIssueEffect;
}

export function RunEffectBadge({ effect, ...rest }: RunEffectBadgeProps) {
	const meta = RUN_ISSUE_EFFECT_META[effect];

	return (
		<MetaBadge
			description={meta.description}
			metaClassName={meta.className}
			dataAttributes={{ 'data-effect': meta.value }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface RunIssueEffectBadgeProps extends BadgeExtras {
	issue: RunIssueRow;
}

/** Derives the effect from the row so no table has to re-implement the OR. */
export function RunIssueEffectBadge({
	issue,
	...rest
}: RunIssueEffectBadgeProps) {
	return <RunEffectBadge effect={runIssueEffect(issue).value} {...rest} />;
}

export interface IssueRulesBadgeProps extends BadgeExtras {
	state: IssueState;
	total: number;
	active: number;
}

/**
 * How much of the issue's machinery is actually running. Shows the counts once
 * there are rules at all, because "2 of 9 active" says more than "Active".
 */
export function IssueRulesBadge({
	state,
	total,
	active,
	...rest
}: IssueRulesBadgeProps) {
	const meta = issueRulesState({ state, total, active });

	return (
		<MetaBadge
			description={meta.description}
			metaClassName={meta.className}
			dataAttributes={{ 'data-rules-state': meta.value }}
			{...rest}
		>
			{total === 0 ? meta.label : `${active} of ${total} active`}
		</MetaBadge>
	);
}

export interface RuleActiveBadgeProps extends BadgeExtras {
	active: boolean;
}

export function RuleActiveBadge({ active, ...rest }: RuleActiveBadgeProps) {
	const meta = ruleActiveMeta(active);

	return (
		<MetaBadge
			description={meta.description}
			metaClassName={meta.className}
			dataAttributes={{ 'data-rule-active': String(active) }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface BugKeyChipProps {
	bugKey: string | null;
	/** Resolved tracker URL, when the project can resolve one. */
	bugUrl?: string | null;
	/** Shown when there is no key, e.g. `#42`. */
	fallback?: string;
	/**
	 * Context prepended to the tooltip, e.g. the issue title and the stamp
	 * origin. The raw `ref://` key stays visible below it.
	 */
	description?: string;
	className?: string;
}

/**
 * The external identity of an issue. `formatBugKey` strips the `ref://TRACKER/`
 * prefix so the chip reads `FOO-123`, with the raw URI kept in the tooltip.
 *
 * Built on `Badge` like every other chip in this module, so it shares their
 * padding, radius and transparent border and sits on the same baseline. It
 * takes `CLASSIFICATION_BADGE_CLASS` for size but deliberately *not* the
 * `uppercase tracking-wide` the meta badges carry: a tracker key is an
 * identifier to be matched against a bug tracker character for character, and
 * letter-spacing a value like `FOO-123` makes that harder, not easier.
 */
export function BugKeyChip({
	bugKey,
	bugUrl,
	fallback,
	description,
	className
}: BugKeyChipProps) {
	const label = formatBugKey(bugKey) ?? fallback;

	if (!label) return null;

	const tooltip = description
		? bugKey
			? `${description} (${bugKey})`
			: description
		: bugKey ?? 'No tracker key linked to this issue';

	return (
		<span className={cn('inline-flex items-center gap-1', className)}>
			<Tooltip content={tooltip}>
				<Badge
					className={cn(
						BUG_KEY_BADGE_CLASS,
						'bg-badge-0 text-text-menu normal-case tracking-normal'
					)}
				>
					{label}
				</Badge>
			</Tooltip>
			{bugUrl ? (
				<Tooltip content="Open in the issue tracker">
					<a
						href={bugUrl}
						target="_blank"
						rel="noreferrer"
						className="grid place-items-center text-text-menu hover:text-primary"
						data-testid="issue-bug-link"
					>
						<Icon name="ExternalLink" size={14} />
					</a>
				</Tooltip>
			) : null}
		</span>
	);
}

export interface ResultIssueBadgesProps {
	issues?: ResultIssueRef[];
	className?: string;
}

/**
 * The per-result stamp, composed so the row reads as a sentence — *which*
 * issue (key chip), *why* it failed (category), *so what* (disposition):
 *
 *     [E2E-105] DEFECT UNEXPECTED
 *     [E2E-105] KNOWN EXPECTED
 *     [E2E-105] DEFECT CLOSED
 *
 * A closed issue renders CLOSED and drops the disposition: its `expected`
 * value is moot, since closing un-suppresses every result regardless (§1 of
 * RESULT-CLASSIFICATION.md). The issue title and stamp origin travel in the
 * key chip's tooltip. This component is the only renderer of per-result
 * stamps — history rows and the run-details Actions cell both consume it.
 */
export function ResultIssueBadges({
	issues,
	className
}: ResultIssueBadgesProps) {
	if (!issues?.length) return null;

	return (
		<div className={cn('flex flex-wrap items-center gap-1', className)}>
			{issues.map((issue) => (
				<Fragment key={issue.rule_id}>
					<BugKeyChip
						bugKey={issue.bug_key ?? null}
						fallback={`#${issue.issue_id}`}
						description={`${issue.issue_title}. ${originMeta(issue.origin).description}`}
					/>
					<CategoryBadge category={issue.category} />
					{issue.issue_state === 'closed' ? (
						<IssueStateBadge state="closed" />
					) : (
						<DispositionBadge expected={issue.expected} />
					)}
				</Fragment>
			))}
		</div>
	);
}
