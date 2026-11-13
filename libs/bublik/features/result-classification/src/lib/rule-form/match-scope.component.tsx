/* SPDX-License-Identifier: Apache-2.0 */
import { useMemo, type RefObject } from 'react';
import { useWatch } from 'react-hook-form';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetClassifyOptionsQuery } from '@/services/bublik-api';
import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	Icon,
	IconButton,
	Skeleton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import type { ClassifyForm } from '../classify/classify-form.types';
import type { RunResults } from '../classify/result-selection.utils';
import {
	ScopeValuePicker,
	type ScopeValueStyle
} from '../pickers/scope-value-picker.component';
import { VerdictLists } from '../pickers/verdict-lists.component';
import { MATCH_SCOPE_COPY } from './match-scope.copy';
import { MATCHER_HINTS } from './matcher-fields.utils';
import {
	clearRulePicks,
	keepSharedTags,
	parameterOptions,
	parametersPicked,
	resetRulePicks,
	ruleKey,
	ruleStanding,
	rulesOf,
	rulesWritten,
	sameAsEarlier,
	setRulePick,
	tagOptions,
	tagsApart,
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

/** The rule's test: package dimmed, the test itself in bold. */
function TestTitle({ rule }: { rule: ClassifyRuleOptions }) {
	const slash = rule.test_path.lastIndexOf('/');
	const pkg = slash >= 0 ? rule.test_path.slice(0, slash + 1) : '';

	return (
		<Tooltip
			content={MATCH_SCOPE_COPY.testHint(
				rule.result_ids.length,
				rule.run_ids.length
			)}
		>
			<span
				className="min-w-0 truncate text-[0.8125rem] leading-5 text-text-secondary"
				data-testid="match-scope-test-path"
			>
				<span className="text-text-menu">{pkg}</span>
				<span className="font-semibold">{rule.test_name}</span>
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

/**
 * One rule: its test on the card's border as an input's label, what it
 * covers and its buttons on the border's right end, then a row per
 * dimension, each edited in place.
 */
function RuleCard({
	rule,
	merged,
	picks,
	setPicks,
	container
}: {
	rule: ClassifyRuleOptions;
	/** The rule matches on what an earlier one does: stored as one with it. */
	merged: boolean;
} & PicksProps) {
	const standing = ruleStanding(rule, picks);
	const results = rule.result_ids.length;
	const stored = rulesOf(rule, picks);

	return (
		<section
			className="relative mt-3 rounded-lg border border-border-primary px-3 pb-2.5 pt-4"
			data-testid="match-scope-test"
			data-test-id={rule.test_id}
			data-rule-key={ruleKey(rule)}
		>
			<div
				className={cn(
					'absolute top-[-11px] left-2 z-10 flex max-w-[55%] items-center px-1',
					FLOATING_LABEL_BACKDROP_CLASS
				)}
			>
				<TestTitle rule={rule} />
			</div>
			<div className="absolute top-[-11px] right-[9px] z-10 flex items-center gap-1 bg-bg-primary px-1">
				<StandingBadge standing={standing} />
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
			</div>

			<div className="flex flex-col gap-1">
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
				<ScopeValuePicker
					label="Tags"
					hint={MATCHER_HINTS.tags}
					options={tagOptions(rule)}
					value={tagsPicked(rule, picks)}
					onChange={(next) =>
						setPicks(setRulePick(picks, rule, { tags: next }))
					}
					styleOf={tagStyle}
					emptyText={
						rule.run_ids.length > 1 ? 'none on these runs' : 'none on this run'
					}
					container={container}
					testId="match-scope-tags"
				/>
			</div>
		</section>
	);
}

function Rules({
	options,
	...rest
}: { options: ClassifyOptions } & PicksProps) {
	const { picks, setPicks } = rest;
	const several = options.length > 1;
	const written = rulesWritten(options, picks);
	const apart = several ? tagsApart(options, picks).length : 0;

	return (
		<div className="flex flex-col gap-3">
			{several ? (
				<p
					className="-mb-1 pl-2 text-xs text-text-menu"
					data-testid="match-scope-summary"
				>
					<span className="text-[0.6875rem] uppercase tracking-wider">
						{written} rule{written > 1 ? 's' : ''}
					</span>
					{/* The one step that most often turns a rule per run into one
					    rule for them all. */}
					{apart ? (
						<span data-testid="match-scope-tags-apart">
							{' · '}
							{MATCH_SCOPE_COPY.tagsApart(apart)}{' '}
							<button
								type="button"
								onClick={() => setPicks(keepSharedTags(options, picks))}
								className="text-primary hover:underline"
								data-testid="match-scope-keep-shared"
							>
								{MATCH_SCOPE_COPY.keepShared}
							</button>
						</span>
					) : null}
				</p>
			) : null}
			{options.map((rule, index) => (
				<RuleCard
					key={ruleKey(rule)}
					rule={rule}
					merged={sameAsEarlier(options, index, picks)}
					{...rest}
				/>
			))}
		</div>
	);
}

/**
 * What the rules written for these results will match on. The rules are
 * those `/results/classify/options/` gives, and the section is their list:
 * each rule is a card titled with its test, starting with all the parameters
 * its results share, their verdicts and the important tags of their runs,
 * and each is narrowed on its own, in place. Emptying a field stops matching
 * on it. Rules left matching on the same values are stored as one, which
 * the later card says.
 *
 * Results classified just this once get rules saved switched off, which
 * future runs never meet, so there is nothing to scope and the cards fold
 * away; what was picked is kept for a switch back.
 */
export function MatchScope({
	form,
	runs,
	container
}: {
	form: ClassifyForm;
	/** The results, by run. */
	runs: RunResults[];
	container?: RefObject<HTMLElement>;
}) {
	const count = runs.reduce((sum, run) => sum + run.resultIds.length, 0);
	const resultIds = useMemo(() => runs.flatMap((run) => run.resultIds), [runs]);
	const {
		data: options,
		isLoading,
		isError
	} = useGetClassifyOptionsQuery(count ? { resultIds } : skipToken, {
		// The rules follow the runs' tags, which a re-import may have changed
		// since the form was last open on these results.
		refetchOnMountOrArgChange: true
	});
	const [scope, picks] = useWatch({
		control: form.control,
		name: ['scope', 'picks']
	});
	const plural = count > 1;

	if (scope === 'oneoff') {
		return (
			<p
				className="pl-2 text-xs text-text-menu"
				data-testid="match-scope-oneoff"
			>
				The rule is saved switched off: only{' '}
				{plural ? 'these results are' : 'this result is'} classified, and future
				runs are left alone.
			</p>
		);
	}

	const loading = isLoading || (count > 0 && !options && !isError);
	const several = (options?.length ?? 0) > 1;

	return (
		// `pl-2`, as the section's headers and the fields' floating labels: the
		// text starts on that one line.
		<div className="flex flex-col gap-3" data-testid="match-scope">
			<p className="pl-2 text-xs text-text-menu">
				{several ? MATCH_SCOPE_COPY.specificHint : MATCH_SCOPE_COPY.sectionHint}
			</p>

			{isError ? (
				<p className="pl-2 text-xs text-text-unexpected">
					Could not load what{' '}
					{plural ? 'these results carry' : 'this result carries'}; saving tries
					again.
				</p>
			) : loading || !options ? (
				<div className="mt-2 flex flex-col gap-4">
					<Skeleton className="h-24 rounded-lg" />
					<Skeleton className="h-24 rounded-lg" />
				</div>
			) : (
				<Rules
					options={options}
					picks={picks as ScopePicks}
					setPicks={(next) =>
						form.setValue('picks', next, { shouldDirty: true })
					}
					container={container}
				/>
			)}
		</div>
	);
}
