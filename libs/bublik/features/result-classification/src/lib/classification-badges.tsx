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
	IssueState,
	ResultIssueRef,
	RunIssueRow
} from '@/shared/types';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	RESULT_VERDICT_CHIP_CLASS,
	type ResultClassification,
	resultClassification,
	type RunIssueEffect,
	RUN_ISSUE_EFFECT_META,
	NO_EFFECT_META,
	UNTRIAGED_META,
	categoryMeta,
	dispositionMeta,
	formatBugKey,
	issueRulesState,
	issueStateMeta,
	originMeta,
	ruleActiveMeta,
	runIssueEffect,
	type RuleResultOrigin
} from './classification-colors';
import { ClassifyButton } from './classify-button';

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
	/**
	 * The chip's value is currently in the filter. Handed straight to `Badge`,
	 * which outlines the chip in its own variant's hue -- so a green chip
	 * selects green and a violet one violet, the way the obtained-result badge
	 * on the run page already behaves.
	 */
	isSelected?: boolean;
	/** Makes the chip a filter toggle. Omit on a read-only surface. */
	onClick?: () => void;
}

/**
 * What a chip picks up once it is a filter control: a tooltip that says what
 * clicking will do, and the button plumbing.
 *
 * The appearance is no longer here. `Badge` owns the hover preview and the
 * selected outline and derives both from the chip's variant, so a category chip
 * in a table and a disposition chip beside it answer to the click in the same
 * way -- and a read-only surface, which passes no `onClick`, is left exactly as
 * it was.
 */
function toggleShell({ isSelected, onClick }: BadgeExtras) {
	return {
		// A chip that does nothing must not promise that it does.
		hint: onClick
			? isSelected
				? ' Click to remove it from the filter.'
				: ' Click to filter by this.'
			: '',
		// Only when it is really a button: `Badge` renders a `div` without an
		// `onClick`, and `type` has no meaning there.
		buttonProps: onClick ? ({ type: 'button' } as const) : null
	};
}

interface MetaBadgeProps extends BadgeExtras {
	description: string;
	/** The chip's whole colour story; comes from a meta map. */
	variant: BadgeVariants;
	children: ReactNode;
	dataAttributes?: Record<string, string>;
}

/** The shared shell: tooltip carries the meaning, badge carries the colour. */
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
				// Stated rather than inferred from `onClick`: the tooltip wrapping
				// every chip is a Radix trigger, and it injects an `onClick` of its
				// own to dismiss itself. A read-only chip would otherwise offer a
				// hover preview of a filter it cannot toggle.
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
	/** The long form, for places with room. Defaults to the chip label. */
	long?: boolean;
}

export function CategoryBadge({ category, long, ...rest }: CategoryBadgeProps) {
	const meta = categoryMeta(category);

	return (
		<MetaBadge
			description={meta.description}
			variant={meta.variant}
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
	/** Categories currently in the filter, so the matching chips show selected. */
	selectedCategories?: readonly string[];
	/** Makes the chips filter toggles. Omit for a read-only surface. */
	onCategoryClick?: (category: IssueCategory) => void;
}

/**
 * A result may be stamped by several of an issue's rules, so the same category
 * legitimately arrives more than once. Dedupe, then order by `CATEGORY_ORDER`
 * so the same set of categories always renders in the same sequence.
 */
export function CategoryBadgeList({
	categories,
	className,
	selectedCategories,
	onCategoryClick
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
				<CategoryBadge
					key={category}
					category={category}
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
			variant={UNTRIAGED_META.variant}
			dataAttributes={{ 'data-effect': UNTRIAGED_META.value }}
			{...props}
		>
			{UNTRIAGED_META.label}
		</MetaBadge>
	);
}

/**
 * A result that passed while carrying stamps. The third answer on this line,
 * beside Untriaged and the four effects, and the only one that is not a
 * verdict: the rules did nothing here because there was nothing to do.
 */
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
			variant={meta.variant}
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
			variant={meta.variant}
			dataAttributes={{ 'data-rule-active': String(active) }}
			{...rest}
		>
			{meta.label}
		</MetaBadge>
	);
}

export interface ProjectBadgeProps extends BadgeExtras {
	/** The project's name, which is also the value the facet filters on. */
	name: string;
}

/**
 * Which project's classifier a rule belongs to.
 *
 * Deliberately not a `Badge`. Every `Badge` in these tables asserts something —
 * this category, this disposition, this effect on the run — and takes a hue
 * from its meta map to say it. A project asserts nothing; it is identity. So it
 * wears the app's neutral chip instead: the same `bg-badge-0` shape the
 * dashboard's cell links and the matcher's tag chips already use, which reads
 * as a label rather than as a verdict competing with the chips beside it.
 *
 * Class string kept in step with `linkStyles` in
 * `dashboard-v2/.../cell-link.component.tsx`. Not imported from there — that
 * would be a dependency between two feature libs for six utility classes.
 */
export function ProjectBadge({
	name,
	className,
	isSelected,
	onClick
}: ProjectBadgeProps) {
	const toggle = toggleShell({ isSelected, onClick });
	// A real `button` when it does something, a `span` when it does not. `type`
	// on a span is inert markup, and a chip you can click but not tab to is only
	// a control for people using a mouse.
	const Chip = onClick ? 'button' : 'span';

	return (
		<Tooltip content={`Rules in ${name}${toggle.hint}`}>
			<Chip
				className={cn(
					'py-0.5 px-2 truncate rounded',
					'text-[0.75rem] font-medium leading-[1.125rem]',
					'text-text-primary',
					// Written as an either/or rather than layered, so only one
					// background class is ever emitted and the result does not depend
					// on `cn` resolving the conflict.
					isSelected ? 'bg-primary-wash' : 'bg-badge-0',
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
 *
 * The way out to the tracker trails the key, inside the pill and ruled off from
 * it -- `[FOO-123 | ↗]`. Parked outside the badge the icon floated in whatever
 * whitespace the cell happened to have, which in the tables that stretched the
 * chip left it at the far edge, nowhere near the key it opens. One badge
 * holding both makes them read as a single object, and the key still comes
 * first because that is what the chip is for -- the icon is the way out of it.
 * The rule is what stops the icon reading as part of the key itself, and both
 * it and the icon are dropped when the project cannot resolve a URL, rather
 * than leaving an empty slot and a divider with nothing on one side of it.
 *
 * The badge is therefore no longer itself a link -- it holds two, pointing at
 * different places -- so `closed` strikes the key alone. A closed issue's
 * tracker link still works, and a struck-through icon would say otherwise.
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

	// Carried by the key rather than by the pill around it: the pill also holds
	// the tracker link, which a closed issue does not disable.
	const keyProps = {
		className: cn(
			// `underline` and `line-through` are the same CSS property, so the hover
			// underline would *replace* the strike — the issue would look alive
			// exactly while you point at it. Keep the colour change only.
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
					{/* Inset rather than full-bleed: `h-full` would run the rule into
					    the pill's own padding and read as a broken border. */}
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
	/**
	 * Whether the result itself failed. Required, not defaulted: it decides
	 * whether any of this means anything, and a new call site that has not
	 * thought about it should not compile.
	 */
	hasError: boolean;
	/**
	 * Classifications currently filtered on, so a matching chip shows selected.
	 */
	selectedClassifications?: string[];
	/**
	 * Makes the verdict chip a filter toggle. Omit for a read-only surface --
	 * the chip then keeps its colour and loses every affordance, like the
	 * category chips beneath it.
	 */
	onClassificationClick?: (classification: ResultClassification) => void;
	/**
	 * The result this verdict describes. Given one, a Classify trigger trails the
	 * chip -- or stands alone on the rows that no longer carry one. Omit on a
	 * surface where classifying makes no sense.
	 */
	resultId?: number;
	/**
	 * Project the result belongs to. `useClassify` falls back to the global
	 * `?project=` selector, but a row that knows its own project should say so:
	 * a history page can show results from several at once.
	 */
	projectId?: number;
	/**
	 * Draws a rule before whatever this renders, so it reads as a continuation of
	 * the result badge it trails — `FAILED | UNTRIAGED | Classify`. Off in the
	 * one place with no result badge in front of it, where a rule with nothing on
	 * one side reads as a stray mark.
	 */
	withLeadingSeparator?: boolean;
}

/** Only between two things, and never at an edge with nothing beyond it. */
function VerticalRule() {
	return (
		<Separator orientation="vertical" className="h-3.5 bg-border-primary" />
	);
}

/**
 * What the classification decided about one result, as the tail of its result
 * line:
 *
 *     FAILED | UNTRIAGED | Classify
 *     FAILED | Classify
 *     PASSED | Classify
 *
 * One chip, and only ever the untriaged one. The classification has five other
 * answers -- the four effects and NO EFFECT -- and each was once a chip here,
 * but they restate on every row what the stamps directly beneath already say,
 * and they say it in the width of the result line. UNTRIAGED is the one that
 * does not: there are no stamps under it to read instead, and it is the only
 * verdict that asks the reader for something. The others are still there to
 * filter on, in the run toolbar's Classification facet, and still visible per
 * issue in the stamps below.
 *
 * The chip that remains is computed across every stamp, because that is how the
 * backend decides: a result with one suppressing rule and one that does not is
 * suppressed, and a per-stamp answer could contradict itself.
 *
 * `resultClassification` returning nothing -- a result that passed carrying no
 * stamps -- still empties the whole line, Classify included: there is nothing to
 * report and nothing worth classifying. So Classify appears on exactly the rows
 * it always did, any failure and any stamped pass, whether or not a chip travels
 * with it.
 *
 * `RESULT_VERDICT_CHIP_CLASS` stays on the chip, though it no longer buys what
 * it was for. Rows differ now, so the Classify trigger cannot land at one offset
 * down the table; boxing keeps the untriaged chips themselves a single width.
 */
export function ClassificationVerdict({
	issues,
	hasError,
	resultId,
	projectId,
	selectedClassifications,
	onClassificationClick,
	withLeadingSeparator = true
}: ClassificationVerdictProps) {
	const meta = resultClassification({ issues, hasError });

	// A passing, unstamped result has no classification to report and nothing
	// worth classifying, so the result badge stands alone.
	if (!meta) return null;

	const showVerdict = meta.value === UNTRIAGED_META.value;
	const showClassify = resultId !== undefined;

	// A read-only surface -- history, which classifies from the run -- has
	// nothing left to draw once the chip is gone. Returning an empty flex box
	// would leave its leading rule standing with nothing beside it.
	if (!showVerdict && !showClassify) return null;

	/*
	 * Classify sits with the verdict it changes rather than in the Actions
	 * column, where it used to live among the navigation links — three columns
	 * from the chip that tells you whether it is needed. It stays on rows that
	 * already carry stamps: one rule explaining a failure does not stop a second
	 * one being true.
	 */
	return (
		<div className="flex items-center gap-1.5">
			{withLeadingSeparator ? <VerticalRule /> : null}
			{showVerdict ? (
				<div className="contents" data-testid="result-untriaged">
					<UntriagedBadge
						isSelected={selectedClassifications?.includes(meta.value)}
						onClick={
							onClassificationClick
								? () => onClassificationClick(meta.value)
								: undefined
						}
						className={RESULT_VERDICT_CHIP_CLASS}
					/>
				</div>
			) : null}
			{/* Between two things, never at an edge: a chipless row reads
			    `FAILED | Classify`, not `FAILED | | Classify`. */}
			{showVerdict && showClassify ? <VerticalRule /> : null}
			{showClassify ? (
				<ClassifyButton resultId={resultId} projectId={projectId} />
			) : null}
		</div>
	);
}

export interface ResultIssueBadgesProps {
	issues?: ResultIssueRef[];
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

interface IssueStampGroup {
	issue: ResultIssueRef;
	categories: IssueCategory[];
	origins: RuleResultOrigin[];
}

/**
 * One entry per issue, not per stamp.
 *
 * A result carries one stamp per *rule* that matched it, so an issue with three
 * rules stamped the same key three times down the cell and one bug read as
 * three. Everything a stamp says about its issue — key, title, state — is the
 * same across the group, so only the category differs, and that is what the
 * grouped row lists.
 *
 * First-appearance order, so the cell keeps the order the backend sent.
 */
function groupStampsByIssue(stamps: readonly ResultIssueRef[]) {
	const groups = new Map<number, IssueStampGroup>();

	for (const stamp of stamps) {
		const group = groups.get(stamp.issue_id);

		if (!group) {
			groups.set(stamp.issue_id, {
				issue: stamp,
				categories: [stamp.category],
				origins: [stamp.origin]
			});
			continue;
		}

		group.categories.push(stamp.category);
		if (!group.origins.includes(stamp.origin)) group.origins.push(stamp.origin);
	}

	return Array.from(groups.values());
}

/**
 * Where a group's stamps came from, for the key chip's tooltip. One origin
 * reads as the sentence it always did; several have to be named, because
 * "stamped by hand" is not true of an issue half of whose rules fired on
 * import.
 */
function originDescription(origins: readonly RuleResultOrigin[]) {
	if (origins.length === 1) return originMeta(origins[0]).description;

	return `Stamped by several rules (${origins
		.map((origin) => originMeta(origin).label)
		.join(', ')}).`;
}

/**
 * The reasons behind a result's classification: which issues explain it, and
 * why.
 *
 *     [E2E-114] | ENV  FLAKY
 *     [#20]     | DEFECT
 *
 * One line per issue — the key once, then every category its rules stamped —
 * laid out in two columns so the categories share an edge however long the keys
 * are. A column rather than a wrapping run, because inline the stamps of a
 * multiply-matched result ran together and could break mid-stamp, reading as
 * though two different bugs were involved.
 *
 * The verdict this explains — SUPPRESSED, UNTRIAGED, NO EFFECT — is not here:
 * it belongs to the result badge and sits on its line, drawn by
 * `ClassificationVerdict`.
 *
 * The categories stay one chip each rather than becoming a run of words inside
 * the key chip, because each is a filter control: clicking DEFECT here is the
 * same write as ticking DEFECT in the toolbar.
 *
 * A stamp whose issue has been closed is struck through. Closing deactivates
 * the rules but leaves the stamps standing, which is right — they record that
 * a rule once matched — so the strike is what stops a dead issue reading as a
 * live explanation. It has to be per issue: the verdict chip only implies
 * "closed" when the disposition was expected, and on a row carrying several
 * issues it cannot say which of them died.
 *
 * The issue title and stamp origin travel in the key chip's tooltip.
 */
export function ResultIssueBadges({
	issues,
	className,
	withSeparator,
	selectedCategories,
	onCategoryClick
}: ResultIssueBadgesProps) {
	const groups = groupStampsByIssue(issues ?? []);

	if (!groups.length) return null;

	/*
	 * The columns size to their content: padding a key chip out to some wider
	 * column's width trades a ragged edge for a gap, which is not a trade.
	 *
	 * The group wrappers are `contents`: they carry the `data-*` hooks the e2e
	 * suite reads, and without it each would be a single box and take its chips
	 * out of the columns.
	 */
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
