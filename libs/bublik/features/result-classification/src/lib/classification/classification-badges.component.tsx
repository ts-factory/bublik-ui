/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import {
	Badge,
	BadgeVariants,
	Icon,
	Separator,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';
import type {
	IssueCategory,
	IssueRuleRef,
	IssueState,
	ResultIssueRef,
	RunIssueRow
} from '@/shared/types';

import type {
	IssueRulesState,
	RunIssueEffect,
	RuleResultOrigin
} from './classification.types';
import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	ISSUE_RULES_STATE_META,
	RUN_ISSUE_EFFECT_META,
	NO_EFFECT_META,
	UNTRIAGED_META
} from './classification.constants';
import {
	resultClassification,
	categoryMeta,
	dispositionMeta,
	formatBugKey,
	issueStateMeta,
	originMeta,
	ruleActiveMeta,
	runIssueEffect
} from './classification.utils';
import { ClassifyButton } from '../classify/classify-button.container';

const BUG_KEY_BADGE_CLASS = 'text-[0.6875rem] leading-[1.125rem]';

interface BadgeExtras {
	className?: string;
	isSelected?: boolean;
	onClick?: () => void;
}

function toggleShell({ isSelected, onClick }: BadgeExtras) {
	return {
		hint: onClick
			? isSelected
				? ' Click to remove it from the filter.'
				: ' Click to filter by this.'
			: '',
		buttonProps: onClick ? ({ type: 'button' } as const) : null
	};
}

interface MetaBadgeProps extends BadgeExtras {
	description: string;
	variant: BadgeVariants;
	children: ReactNode;
	dataAttributes?: Record<string, string>;
}

function MetaBadge({
	description,
	variant,
	children,
	dataAttributes,
	className,
	isSelected,
	onClick
}: MetaBadgeProps) {
	const toggle = toggleShell({ isSelected, onClick });

	return (
		<Tooltip content={`${description}${toggle.hint}`}>
			<Badge
				variant={variant}
				isSelected={isSelected}
				isInteractive={Boolean(onClick)}
				className={cn(CLASSIFICATION_BADGE_CLASS, className)}
				onClick={onClick}
				{...toggle.buttonProps}
				{...dataAttributes}
			>
				{children}
			</Badge>
		</Tooltip>
	);
}

export interface CategoryBadgeProps extends BadgeExtras {
	category: IssueCategory;
	long?: boolean;
	/**
	 * The disposition the category is carried under, when the caller knows it.
	 * It reads in the tooltip rather than on the badge: whether a category
	 * suppresses is what a reader wants on hover, not a second word competing
	 * with the category name in a table cell.
	 */
	expected?: boolean | null;
}

export function CategoryBadge({
	category,
	long,
	expected,
	...rest
}: CategoryBadgeProps) {
	const meta = categoryMeta(category);
	const disposition = expected === undefined ? null : dispositionMeta(expected);

	return (
		<MetaBadge
			description={
				disposition
					? `${meta.description} ${disposition.description}`
					: meta.description
			}
			variant={meta.variant}
			dataAttributes={{
				'data-category': category,
				...(disposition ? { 'data-disposition': disposition.value } : null)
			}}
			{...rest}
		>
			{long ? meta.displayValue : meta.label}
		</MetaBadge>
	);
}

/** All a category badge needs from a rule, a run-issue rule or a stamp. */
type CategoryDisposition = Pick<IssueRuleRef, 'category' | 'expected'>;

export interface CategoryBadgeListProps {
	categories: readonly CategoryDisposition[];
	className?: string;
	selectedCategories?: readonly string[];
	onCategoryClick?: (category: IssueCategory) => void;
}

/**
 * One badge per distinct category.
 *
 * The list arrives as `(category, expected)` pairs, and the same category can
 * appear under more than one disposition — an issue can hold both an expected
 * and an unexpected `flaky` rule. Deduping has to be on the category itself:
 * deduping the pairs would leave two badges reading `Flaky` side by side, and a
 * `Set` of the objects dedupes nothing at all, since every pair is a fresh
 * object. Where a category is carried by rules that disagree, the disposition
 * is dropped rather than picking a winner.
 */
export function CategoryBadgeList({
	categories,
	className,
	selectedCategories,
	onCategoryClick
}: CategoryBadgeListProps) {
	// `undefined` is "the rules disagree", which is not the same as `null` —
	// that is a disposition in its own right, the marker-only one.
	const byCategory = new Map<IssueCategory, boolean | null | undefined>();

	for (const ref of categories) {
		if (byCategory.has(ref.category)) {
			if (byCategory.get(ref.category) !== ref.expected) {
				byCategory.set(ref.category, undefined);
			}
			continue;
		}

		byCategory.set(ref.category, ref.expected);
	}

	const unique = Array.from(byCategory.keys()).sort(
		(a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
	);

	if (!unique.length) return null;

	return (
		<div className={cn('flex items-center gap-1', className)}>
			{unique.map((category) => (
				<CategoryBadge
					key={category}
					category={category}
					expected={byCategory.get(category)}
					isSelected={selectedCategories?.includes(category)}
					onClick={
						onCategoryClick ? () => onCategoryClick(category) : undefined
					}
				/>
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
			variant={meta.variant}
			dataAttributes={{ 'data-issue-state': state }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface DispositionBadgeProps extends BadgeExtras {
	expected: boolean | null | undefined;
	aggregate?: boolean;
}

export function DispositionBadge({
	expected,
	aggregate,
	...rest
}: DispositionBadgeProps) {
	const meta = dispositionMeta(expected);

	return (
		<MetaBadge
			description={aggregate ? meta.aggregateDescription : meta.description}
			variant={meta.variant}
			dataAttributes={{ 'data-disposition': meta.value }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
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
			variant={meta.variant}
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

export function RunIssueEffectBadge({
	issue,
	...rest
}: RunIssueEffectBadgeProps) {
	return <RunEffectBadge effect={runIssueEffect(issue).value} {...rest} />;
}

export function UntriagedBadge(props: BadgeExtras) {
	return (
		<MetaBadge
			description={UNTRIAGED_META.description}
			variant={UNTRIAGED_META.variant}
			dataAttributes={{ 'data-effect': UNTRIAGED_META.value }}
			{...props}
		>
			{UNTRIAGED_META.label}
		</MetaBadge>
	);
}

export function NoEffectBadge(props: BadgeExtras) {
	return (
		<MetaBadge
			description={NO_EFFECT_META.description}
			variant={NO_EFFECT_META.variant}
			dataAttributes={{ 'data-effect': NO_EFFECT_META.value }}
			{...props}
		>
			{NO_EFFECT_META.label}
		</MetaBadge>
	);
}

export interface IssueRulesBadgeProps extends BadgeExtras {
	/** The issue's `rules_state`, as the server derives it. */
	rulesState: IssueRulesState;
	total: number;
	active: number;
}

export function IssueRulesBadge({
	rulesState,
	total,
	active,
	...rest
}: IssueRulesBadgeProps) {
	const meta = ISSUE_RULES_STATE_META[rulesState];

	return (
		<MetaBadge
			description={meta.description}
			variant={meta.variant}
			dataAttributes={{ 'data-rules-state': meta.value }}
			{...rest}
		>
			{total === 0 ? meta.label : `${active} of ${total} active`}
		</MetaBadge>
	);
}

export interface IssueRulesStateBadgeProps extends BadgeExtras {
	rulesState: IssueRulesState;
}

/** The rules state alone, without the counts `IssueRulesBadge` reads. */
export function IssueRulesStateBadge({
	rulesState,
	...rest
}: IssueRulesStateBadgeProps) {
	const meta = ISSUE_RULES_STATE_META[rulesState];

	return (
		<MetaBadge
			description={meta.description}
			variant={meta.variant}
			dataAttributes={{ 'data-rules-state': meta.value }}
			{...rest}
		>
			{meta.label}
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
			variant={meta.variant}
			dataAttributes={{ 'data-rule-active': String(active) }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface ProjectBadgeProps extends BadgeExtras {
	name: string;
}

export function ProjectBadge({
	name,
	className,
	isSelected,
	onClick
}: ProjectBadgeProps) {
	const toggle = toggleShell({ isSelected, onClick });
	const Chip = onClick ? 'button' : 'span';

	return (
		<Tooltip content={`Rules in ${name}${toggle.hint}`}>
			<Chip
				className={cn(
					'py-0.5 px-2 max-w-[8rem] truncate rounded',
					'text-[0.75rem] font-medium leading-[1.125rem]',
					'text-text-primary',
					'border border-transparent',
					isSelected ? 'bg-primary-wash border-primary' : 'bg-badge-0',
					className
				)}
				onClick={onClick}
				data-project-name={name}
				{...toggle.buttonProps}
			>
				{name}
			</Chip>
		</Tooltip>
	);
}

export interface BugKeyChipProps {
	bugKey: string | null;
	bugUrl?: string | null;
	fallback?: string;
	description?: string;
	className?: string;
	issueId?: number;
	closed?: boolean;
}

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

	const keyProps = {
		className: cn(
			issueId !== undefined &&
				(closed ? 'hover:text-primary' : 'hover:text-primary hover:underline'),
			closed && 'line-through opacity-60'
		),
		'data-issue-state': closed ? 'closed' : undefined
	};

	return (
		<Badge
			className={cn(
				BUG_KEY_BADGE_CLASS,
				'gap-1.5 bg-badge-0 normal-case tracking-normal font-mono',
				className
			)}
		>
			<Tooltip content={tooltip}>
				{issueId !== undefined ? (
					<LinkWithProject
						to={routes.issue({ issueId })}
						data-testid="issue-key-link"
						{...keyProps}
					>
						{label}
					</LinkWithProject>
				) : (
					<span {...keyProps}>{label}</span>
				)}
			</Tooltip>
			{bugUrl ? (
				<>
					<Separator orientation="vertical" className="h-3" />
					<Tooltip content="Open in the issue tracker">
						<a
							href={bugUrl}
							target="_blank"
							rel="noreferrer"
							className="grid place-items-center hover:text-primary"
							data-testid="issue-bug-link"
						>
							<Icon name="ExternalLink" size={14} />
						</a>
					</Tooltip>
				</>
			) : null}
		</Badge>
	);
}

export interface ClassificationVerdictProps {
	issues?: ResultIssueRef[];
	hasError: boolean;
	/** See `resultClassification` — `has_error` alone cannot tell this. */
	effectiveExpected?: boolean;
	resultId?: number;
	projectId?: number;
	withLeadingSeparator?: boolean;
	/** Whether to show the SUPPRESSED / STALE chip beside the Classify button. */
	withEffect?: boolean;
}

/**
 * The two states where the classification changed what the result *counts as*,
 * and so has to be legible on the line rather than only in the stamps beneath
 * it: a failure held out of the unexpected counts, and one whose issue has
 * since closed so it counts again. `unexpected` and `marked` leave the result
 * reading exactly as it would unclassified, and `no-effect` says as much.
 */
const OUTCOME_CHANGING: ReadonlySet<string> = new Set(['suppressed', 'stale']);

function VerticalRule() {
	return (
		<Separator orientation="vertical" className="h-3.5 bg-border-primary" />
	);
}

export function ClassificationVerdict({
	issues,
	hasError,
	effectiveExpected,
	resultId,
	projectId,
	withLeadingSeparator = true,
	withEffect = true
}: ClassificationVerdictProps) {
	const meta = resultClassification({ issues, hasError, effectiveExpected });

	if (!meta) return null;

	if (resultId === undefined) return null;

	const effect = withEffect && OUTCOME_CHANGING.has(meta.value) ? meta : null;

	return (
		<div className="flex items-center gap-1.5">
			{withLeadingSeparator ? <VerticalRule /> : null}
			{effect ? (
				<MetaBadge
					description={effect.description}
					variant={effect.variant}
					dataAttributes={{ 'data-classification': effect.value }}
				>
					{effect.label}
				</MetaBadge>
			) : null}
			<ClassifyButton resultId={resultId} projectId={projectId} />
		</div>
	);
}

export interface ResultIssueBadgesProps {
	issues?: ResultIssueRef[];
	className?: string;
	withSeparator?: boolean;
	selectedCategories?: string[];
	onCategoryClick?: (category: IssueCategory) => void;
}

interface IssueStampGroup {
	issue: ResultIssueRef;
	/** Each stamp names both, so the badges can say how the category counts. */
	categories: CategoryDisposition[];
	origins: RuleResultOrigin[];
}

function groupStampsByIssue(stamps: readonly ResultIssueRef[]) {
	const groups = new Map<number, IssueStampGroup>();

	for (const stamp of stamps) {
		const group = groups.get(stamp.issue_id);

		if (!group) {
			groups.set(stamp.issue_id, {
				issue: stamp,
				categories: [{ category: stamp.category, expected: stamp.expected }],
				origins: [stamp.origin]
			});
			continue;
		}

		group.categories.push({
			category: stamp.category,
			expected: stamp.expected
		});
		if (!group.origins.includes(stamp.origin)) group.origins.push(stamp.origin);
	}

	return Array.from(groups.values());
}

function originDescription(origins: readonly RuleResultOrigin[]) {
	if (origins.length === 1) return originMeta(origins[0]).description;

	return `Stamped by several rules (${origins
		.map((origin) => originMeta(origin).label)
		.join(', ')}).`;
}

export function ResultIssueBadges({
	issues,
	className,
	withSeparator,
	selectedCategories,
	onCategoryClick
}: ResultIssueBadgesProps) {
	const groups = groupStampsByIssue(issues ?? []);

	if (!groups.length) return null;

	const body = (
		<div
			className={cn(
				'grid grid-cols-[max-content_max-content] items-center justify-start gap-x-1.5 gap-y-1',
				className
			)}
		>
			{groups.map(({ issue, categories, origins }) => (
				<div
					key={issue.issue_id}
					className="contents"
					data-testid="result-issue-stamp"
					data-issue-id={issue.issue_id}
				>
					<BugKeyChip
						bugKey={issue.bug_key ?? null}
						issueId={issue.issue_id}
						fallback={`#${issue.issue_id}`}
						closed={issue.issue_state === 'closed'}
						description={`${issue.issue_title}. ${originDescription(origins)}`}
					/>
					<div className="flex items-center gap-1.5">
						<VerticalRule />
						<CategoryBadgeList
							categories={categories}
							selectedCategories={selectedCategories}
							onCategoryClick={onCategoryClick}
						/>
					</div>
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
