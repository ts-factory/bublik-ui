/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	FormSectionError,
	Icon,
	IconButton,
	cn
} from '@/shared/tailwind-ui';

import {
	ScopeValuePicker,
	type ScopeValueStyle
} from '../pickers/scope-value-picker.component';
import { VerdictLists } from '../pickers/verdict-lists.component';
import { RUN_MATCH_SCOPE_COPY } from './match-scope.copy';
import {
	SMALL_CHIP_CLASS,
	TestTitle,
	type PicksProps
} from './match-scope-rule.component';
import { MATCHER_HINTS } from './matcher-fields.utils';
import {
	clearRulePicks,
	parameterOptions,
	parametersPicked,
	resetRulePicks,
	ruleKey,
	ruleStanding,
	rulesOf,
	setRulePick,
	setTagsOfAll,
	tagOptions,
	tagsPicked,
	verdictsKept,
	type RuleStanding,
	type ScopeOption
} from './match-scope.utils';

/** The chip styling the parameters already have in the rules table. */
const PARAMETER_STYLE: ScopeValueStyle = {
	variant: BadgeVariants.Primary,
	className: 'bg-badge-1'
};

/** The tags tell the run's important ones from its relevant ones. */
function tagStyle(option: ScopeOption): ScopeValueStyle {
	return {
		variant: BadgeVariants.Primary,
		className: option.important ? 'bg-badge-6' : 'bg-badge-0'
	};
}

/** The warning badge of a rule wider than it may seem; none when narrowed. */
function StandingBadge({ standing }: { standing: RuleStanding }) {
	if (!standing.warnings.length) return null;

	return (
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
	);
}

function Warnings({ standing }: { standing: RuleStanding }) {
	if (!standing.warnings.length) return null;

	return (
		// The History form's error box with the warning alert's yellow, dimmed:
		// the rule still saves, it only matches more than it may seem to.
		<FormSectionError
			className="bg-bg-fillWarning/40"
			data-testid="match-scope-unnarrowed"
		>
			<div className="shrink-0 text-bg-warning">
				<Icon name="TriangleExclamationMark" size={22} />
			</div>
			<div className="flex flex-col gap-0.5">
				{standing.warnings.map((warning) => (
					<FormSectionError.Subtitle key={warning}>
						{warning}
					</FormSectionError.Subtitle>
				))}
			</div>
		</FormSectionError>
	);
}

/**
 * One test's rule: its title on the card's border as an input's label, the
 * counts and standing on the border's right end as the pickers' bins are,
 * then the warning where the eye lands, then a field per dimension. The
 * tags are the run's, picked once over the cards.
 */
function TestCard({
	rule,
	picks,
	setPicks,
	container
}: { rule: ClassifyRuleOptions } & PicksProps) {
	const standing = ruleStanding(rule, picks);
	const count = rule.result_ids.length;
	const rules = rulesOf(rule, picks);

	return (
		// A card is the test's path and its one rule, so it carries the ids
		// of both.
		<section
			className="relative mt-3 rounded-lg border border-border-primary px-3 pb-3 pt-7"
			data-testid="match-scope-path"
		>
			<div
				className={cn(
					'absolute top-[-11px] left-2 z-10 flex max-w-[60%] items-center px-1',
					FLOATING_LABEL_BACKDROP_CLASS
				)}
			>
				<TestTitle
					path={rule.test_path}
					hint={RUN_MATCH_SCOPE_COPY.testHint(count)}
				/>
			</div>
			<div className="absolute top-[-11px] right-[21px] z-10 flex items-center gap-1 bg-bg-primary px-1">
				<StandingBadge standing={standing} />
				{rules > 1 ? (
					<Badge
						as="span"
						isInteractive={false}
						variant={BadgeVariants.Info}
						className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
						data-testid="match-scope-rules"
					>
						{rules} rules
					</Badge>
				) : null}
				<Badge
					as="span"
					isInteractive={false}
					variant={BadgeVariants.Info}
					className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
					data-testid="match-scope-results"
				>
					{count} result{count > 1 ? 's' : ''}
				</Badge>
				<IconButton
					name="Refresh"
					size={16}
					helpMessage="This test back to what its results share"
					onClick={() =>
						setPicks(
							setRulePick(resetRulePicks(picks, rule), rule, {
								tags: tagsPicked(rule, picks)
							})
						)
					}
					className="!h-[22px] !w-[22px] -scale-x-100"
				/>
				<IconButton
					name="Bin"
					size={14}
					helpMessage="Empty this test's pickers: match on its path alone"
					onClick={() =>
						setPicks(
							setRulePick(clearRulePicks(picks, rule), rule, {
								tags: tagsPicked(rule, picks)
							})
						)
					}
					className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
				/>
			</div>

			<div
				className="flex flex-col gap-5"
				data-testid="match-scope-test"
				data-test-id={rule.test_id}
				data-rule-key={ruleKey(rule)}
			>
				<Warnings standing={standing} />
				{/* The first picker's floating label and bin sit above its border;
				    give them room under the card's own border row. */}
				<div className={cn(standing.warnings.length ? '' : 'mt-2')}>
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
							count > 1 ? 'none shared by its results' : 'none on this result'
						}
						container={container}
						testId="match-scope-parameters"
					/>
				</div>
				<VerdictLists
					hint={RUN_MATCH_SCOPE_COPY.verdictsHint}
					lists={rule.verdicts}
					kept={verdictsKept(rule, picks)}
					onChange={(kept) =>
						setPicks(setRulePick(picks, rule, { verdicts: kept }))
					}
					testId="match-scope-verdicts"
				/>
			</div>
		</section>
	);
}

interface RunMatchScopeProps extends PicksProps {
	/** Rules of one run: a rule per test, see `ofOneRun`. */
	options: ClassifyOptions;
	/** Results classified just this once: the rules show, dimmed and inert. */
	readOnly: boolean;
}

/**
 * The match scope of results of one run, as the form had it before a
 * selection could span runs: the run's tags, shared by every rule, then a
 * card per test holding the values its own rule keeps.
 */
function RunMatchScope({ options, readOnly, ...rest }: RunMatchScopeProps) {
	const { picks, setPicks, container } = rest;
	const [first] = options;
	const several = options.length > 1;
	const rules = options.reduce((sum, rule) => sum + rulesOf(rule, picks), 0);

	return (
		<div
			className={cn('flex flex-col gap-4', readOnly && 'opacity-60')}
			data-readonly={readOnly}
			// Not typed by React 18; the browser takes the attribute as it is.
			{...(readOnly ? { inert: '' } : {})}
		>
			{first ? (
				<div className="mt-2">
					<ScopeValuePicker
						label="Tags"
						hint={MATCHER_HINTS.tags}
						options={tagOptions(first)}
						value={tagsPicked(first, picks)}
						onChange={(next) => setPicks(setTagsOfAll(picks, options, next))}
						styleOf={tagStyle}
						emptyText="none on this run"
						container={container}
						testId="match-scope-tags"
					/>
				</div>
			) : null}
			{/* The label sits in the cards' own column: the first card's floating
			    title already keeps a margin above its border, so the label only
			    needs enough under it for that title to clear. */}
			<div className="flex flex-col gap-3">
				{several ? (
					<p
						className="-mb-1 pl-[14px] text-[0.6875rem] uppercase tracking-wider text-text-menu"
						data-testid="match-scope-summary"
					>
						{options.length} tests,{' '}
						{rules === options.length ? 'one rule each' : `${rules} rules`}
					</p>
				) : null}
				{options.map((rule) => (
					<TestCard key={ruleKey(rule)} rule={rule} {...rest} />
				))}
			</div>
		</div>
	);
}

export { RunMatchScope };
