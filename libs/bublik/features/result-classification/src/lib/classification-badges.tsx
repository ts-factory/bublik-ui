/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { Badge, Icon, Separator, Tooltip, cn } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';
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
	UNTRIAGED_META,
	categoryMeta,
	dispositionMeta,
	formatBugKey,
	issueRulesState,
	issueStateMeta,
	originMeta,
	resultIssueEffect,
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
		// Never wraps. Badge columns size themselves with `w-px`, so the cell is
		// as wide as its min-content -- and a wrapping flex row's min-content is
		// one badge, which stacked the chips into a column and made the column
		// taller instead of wider. Without the wrap, min-content is the whole
		// row, so the cell takes exactly the width the chips need.
		<div className={cn('flex items-center gap-1', className)}>
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

/**
 * A failing result with no stamps at all. The counterpart to the Untriaged
 * checkbox in the history search form: without it, the rows that filter
 * selects are the ones that render nothing, so you cannot see what matched.
 */
export function UntriagedBadge(props: BadgeExtras) {
	return (
		<MetaBadge
			description={UNTRIAGED_META.description}
			metaClassName={UNTRIAGED_META.className}
			dataAttributes={{ 'data-effect': UNTRIAGED_META.value }}
			{...props}
		>
			{UNTRIAGED_META.label}
		</MetaBadge>
	);
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
	/**
	 * Makes the chip a link to the issue's own page. Omit on that page itself —
	 * a link back to where you already are is noise.
	 */
	issueId?: number;
	/**
	 * Strikes the key through, the way SWAMP renders a resolved bug. Opt-in:
	 * surfaces that already carry a State column say it better in words.
	 */
	closed?: boolean;
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
const CLOSED_KEY_NOTE =
	'This issue is closed, so its rules no longer suppress these results.';

export function BugKeyChip({
	bugKey,
	bugUrl,
	fallback,
	description,
	className,
	issueId,
	closed
}: BugKeyChipProps) {
	const label = formatBugKey(bugKey) ?? fallback;

	if (!label) return null;

	const base = description
		? bugKey
			? `${description} (${bugKey})`
			: description
		: bugKey ?? 'No tracker key linked to this issue';
	const tooltip = closed ? `${base} ${CLOSED_KEY_NOTE}` : base;

	const chip = (
		<Badge
			className={cn(
				BUG_KEY_BADGE_CLASS,
				'bg-badge-0 text-text-menu normal-case tracking-normal',
				// `underline` and `line-through` are the same CSS property, so the
				// hover underline would *replace* the strike — the issue would look
				// alive exactly while you point at it. Keep the colour change only.
				issueId !== undefined &&
					(closed
						? 'hover:text-primary'
						: 'hover:text-primary hover:underline'),
				closed && 'line-through opacity-60'
			)}
			data-issue-state={closed ? 'closed' : undefined}
		>
			{label}
		</Badge>
	);

	return (
		<span className={cn('inline-flex items-center gap-1', className)}>
			<Tooltip content={tooltip}>
				{issueId !== undefined ? (
					<LinkWithProject
						to={routes.issue({ issueId })}
						data-testid="issue-key-link"
					>
						{chip}
					</LinkWithProject>
				) : (
					chip
				)}
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
	/**
	 * Whether the result itself failed. Required, not defaulted: it decides
	 * whether any of this means anything, and a new call site that has not
	 * thought about it should not compile.
	 */
	hasError: boolean;
	className?: string;
	/**
	 * Draws a rule above the badges. Lives here rather than at the call site
	 * because the separator must not appear when there is nothing to separate,
	 * and this is where that is already known.
	 */
	withSeparator?: boolean;
	/** Categories currently filtered on, so the matching chips show selected. */
	selectedCategories?: string[];
	/** Makes the category chips filter controls. Omit for a read-only surface. */
	onCategoryClick?: (category: IssueCategory) => void;
}

/**
 * The classification of one result: one answer, then the reasons for it.
 *
 *     SUPPRESSED                 UNTRIAGED            [E2E-114]  FLAKY
 *       [E2E-114]  FLAKY                                ^ passed: no effect
 *       [#20]      DEFECT
 *
 * The top chip is the whole point — does this failure still count — and it is
 * computed across every stamp, because that is how the backend decides. It
 * used to sit on each stamp instead, which could contradict itself: a result
 * with one suppressing rule and one that does not is suppressed, yet a line
 * still read "still counts".
 *
 * Below it, one line per stamp: which issue, and why. A column rather than a
 * wrapping run, because inline the stamps of a multiply-matched result ran
 * together and could break mid-stamp, reading as though two different bugs
 * were involved. The key repeats so no line depends on the one above it.
 *
 * Two cases carry no effect chip. A result that did not fail has nothing to
 * suppress, so its stamps are informational — worth showing, since a
 * known-broken test that passed this time is a fact you want, but the chip
 * would be asserting something untrue. And a failure with no stamps gets
 * UNTRIAGED instead, which is a different question: not what the rules
 * decided, but whether anyone has looked.
 *
 * A stamp whose issue has been closed is struck through. Closing deactivates
 * the rules but leaves the stamps standing, which is right — they record that
 * a rule once matched — so the strike is what stops a dead issue reading as a
 * live explanation. It has to be per stamp: the effect chip only implies
 * "closed" when the disposition was expected, and on a row carrying several
 * stamps it cannot say which of them died.
 *
 * The issue title and stamp origin travel in the key chip's tooltip. This
 * component is the only renderer of per-result classification.
 */
export function ResultIssueBadges({
	issues,
	hasError,
	className,
	withSeparator,
	selectedCategories,
	onCategoryClick
}: ResultIssueBadgesProps) {
	const stamps = issues ?? [];

	if (!stamps.length && !hasError) return null;

	const body = (
		<div className={cn('flex flex-col gap-1', className)}>
			{!stamps.length ? (
				<div data-testid="result-untriaged">
					<UntriagedBadge />
				</div>
			) : null}
			{hasError && stamps.length ? (
				<div data-testid="result-issue-effect">
					<RunEffectBadge effect={resultIssueEffect(stamps).value} />
				</div>
			) : null}
			{stamps.map((issue) => (
				<div
					key={issue.rule_id}
					className="flex flex-wrap items-center gap-1"
					data-testid="result-issue-stamp"
					data-issue-id={issue.issue_id}
				>
					<BugKeyChip
						bugKey={issue.bug_key ?? null}
						issueId={issue.issue_id}
						fallback={`#${issue.issue_id}`}
						closed={issue.issue_state === 'closed'}
						description={`${issue.issue_title}. ${
							originMeta(issue.origin).description
						}`}
					/>
					<CategoryBadge
						category={issue.category}
						isSelected={selectedCategories?.includes(issue.category)}
						onClick={
							onCategoryClick
								? () => onCategoryClick(issue.category)
								: undefined
						}
					/>
				</div>
			))}
		</div>
	);

	if (!withSeparator) return body;

	return (
		<div className="flex flex-col gap-1.5">
			<Separator className="bg-border-primary" />
			{body}
		</div>
	);
}
