/* SPDX-License-Identifier: Apache-2.0 */
import { useMemo, useState, type RefObject } from 'react';
import { useWatch } from 'react-hook-form';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetClassifyOptionsQuery } from '@/services/bublik-api';
import type { ClassifyOptions } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	FormSectionError,
	Icon,
	IconButton,
	InputLabel,
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
import {
	MATCHER_HINTS,
	NO_VERDICTS_TEXT,
	displayKeyValue
} from './matcher-fields.utils';
import {
	clearTestPicks,
	flatRules,
	keepSharedTags,
	parameterOptions,
	parameterValue,
	parametersPicked,
	resetTestPicks,
	setTestPick,
	tagOptions,
	tagsApart,
	tagsPicked,
	testStanding,
	testsOf,
	verdictListsOf,
	verdictsKept,
	type FlatRule,
	type ScopeOption,
	type ScopePicks,
	type ScopeTest,
	type TestStanding
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

interface TestCard {
	test: ScopeTest;
	standing: TestStanding;
	/** Every rule the test gets per category. */
	rules: FlatRule[];
}

interface PicksProps {
	picks: ScopePicks;
	setPicks: (next: ScopePicks) => void;
	container?: RefObject<HTMLElement>;
}

interface CardProps extends PicksProps {
	card: TestCard;
	/**
	 * Whether the card lists its rules. The only rule of a form is not
	 * listed: the pickers already hold all of it.
	 */
	listed: boolean;
	importantTags: ReadonlySet<string>;
}

/** The test's path: package dimmed, the test itself in bold. */
function TestTitle({ test }: { test: ScopeTest }) {
	const slash = test.test_path.lastIndexOf('/');
	const pkg = slash >= 0 ? test.test_path.slice(0, slash + 1) : '';

	return (
		<Tooltip content={MATCH_SCOPE_COPY.testHint(test.result_ids.length)}>
			<span
				className="min-w-0 truncate text-[0.8125rem] leading-5 text-text-secondary"
				data-testid="match-scope-test-path"
			>
				<span className="text-text-menu">{pkg}</span>
				<span className="font-semibold">{test.test_name}</span>
			</span>
		</Tooltip>
	);
}

/** The warning badge of a rule wider than it may seem; none when narrowed. */
function StandingBadge({ standing }: { standing: TestStanding }) {
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

function Warnings({ standing }: { standing: TestStanding }) {
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

function ParametersPicker({
	card,
	picks,
	setPicks,
	container
}: { card: TestCard } & PicksProps) {
	const { test } = card;

	return (
		<ScopeValuePicker
			label="Parameters"
			hint={MATCHER_HINTS.parameters}
			options={parameterOptions(test)}
			value={parametersPicked(test, picks)}
			onChange={(next) =>
				setPicks(setTestPick(picks, test.test_id, { parameters: next }))
			}
			styleOf={() => PARAMETER_STYLE}
			emptyText={
				test.result_ids.length > 1
					? 'none on these results'
					: 'none on this result'
			}
			container={container}
			testId="match-scope-parameters"
		/>
	);
}

/** The verdict lists are kept whole or dropped: the server matches them exactly. */
function VerdictsField({
	card,
	picks,
	setPicks
}: { card: TestCard } & PicksProps) {
	const { test } = card;

	return (
		<VerdictLists
			hint={MATCH_SCOPE_COPY.verdictsHint}
			lists={verdictListsOf(test)}
			numbered={test.rules.length === 1}
			kept={verdictsKept(test, picks)}
			onChange={(kept) =>
				setPicks(setTestPick(picks, test.test_id, { verdicts: kept }))
			}
			testId="match-scope-verdicts"
		/>
	);
}

/** How many of a test's rules show before the rest fold away. */
const RULES_SHOWN = 4;

const RULE_LABEL_CLASS =
	'text-[0.6875rem] uppercase tracking-wider text-text-menu';

/** One dimension of a listed rule: its name, then its values as chips. */
function RuleLine({
	label,
	values,
	empty,
	className,
	classOf,
	labelOf,
	variant = BadgeVariants.Primary
}: {
	label: string;
	values: readonly string[];
	/** What the line reads when the rule does not match on the dimension. */
	empty: string;
	className?: string;
	/** A value's own chip colour, where the line's values differ in it. */
	classOf?: (value: string) => string;
	/** How a value reads, when not as it is. */
	labelOf?: (value: string) => string;
	variant?: BadgeVariants;
}) {
	return (
		<div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-2">
			<span className={RULE_LABEL_CLASS}>{label}</span>
			<div className="flex flex-wrap items-center gap-1">
				{values.length ? (
					values.map((value, index) => (
						<Badge
							// A verdict list is ordered and may repeat a verdict.
							// eslint-disable-next-line react/no-array-index-key
							key={`${index}:${value}`}
							as="span"
							isInteractive={false}
							variant={variant}
							className={cn('text-xs', className, classOf?.(value))}
							overflowWrap
						>
							{labelOf ? labelOf(value) : value}
						</Badge>
					))
				) : (
					<span className="text-xs italic text-text-menu">{empty}</span>
				)}
			</div>
		</div>
	);
}

/**
 * The rules a test gets, one after another, each with everything it matches
 * on: nothing to work out from the pickers above, which only narrow them.
 */
function RuleList({
	rules,
	importantTags
}: {
	rules: readonly FlatRule[];
	/** The runs' important tags, coloured as the Tags picker colours them. */
	importantTags: ReadonlySet<string>;
}) {
	const [all, setAll] = useState(false);
	const shown = all ? rules : rules.slice(0, RULES_SHOWN);
	const folded = rules.length - shown.length;

	return (
		<div className="flex flex-col gap-1.5" data-testid="match-scope-written">
			<p className={cn('pl-[2px]', RULE_LABEL_CLASS)}>
				{MATCH_SCOPE_COPY.writtenLabel}
			</p>
			<ul
				className="mt-2 flex flex-col gap-4"
				aria-label={MATCH_SCOPE_COPY.writtenLabel}
			>
				{shown.map((rule, index) => (
					<li
						// The rows have no identity besides their place in the list.
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						className="relative flex flex-col gap-1 rounded-md border border-border-primary px-2 pb-2 pt-3.5"
						data-testid="match-scope-written-rule"
					>
						{/* On the border, as the fields' labels and the card's badges. */}
						<InputLabel
							className={cn(
								'absolute top-[-11px] left-2 z-10',
								FLOATING_LABEL_BACKDROP_CLASS
							)}
						>
							Rule {index + 1}
						</InputLabel>
						{rule.results !== null ? (
							<div className="absolute top-[-11px] right-[9px] z-10 flex items-center bg-bg-primary px-1">
								<Badge
									as="span"
									isInteractive={false}
									variant={BadgeVariants.Info}
									className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
								>
									{rule.results} result{rule.results > 1 ? 's' : ''}
								</Badge>
							</div>
						) : null}
						<RuleLine
							label="Parameters"
							values={Object.entries(rule.parameters)
								.sort(([left], [right]) => left.localeCompare(right))
								.map(([name, value]) =>
									displayKeyValue(parameterValue(name, value))
								)}
							empty="any"
							className="bg-badge-1"
						/>
						{rule.verdicts?.length === 0 ? (
							<RuleLine label="Verdicts" values={[]} empty={NO_VERDICTS_TEXT} />
						) : (
							<RuleLine
								label="Verdicts"
								values={rule.verdicts ?? []}
								empty="any"
								variant={BadgeVariants.Transparent}
							/>
						)}
						<RuleLine
							label="Tags"
							values={rule.tags}
							empty="any"
							labelOf={displayKeyValue}
							classOf={(tag) =>
								importantTags.has(tag) ? 'bg-badge-6' : 'bg-badge-0'
							}
						/>
					</li>
				))}
			</ul>
			{rules.length > RULES_SHOWN ? (
				<button
					type="button"
					onClick={() => setAll(!all)}
					className="self-start pl-[2px] text-xs text-primary hover:underline"
					data-testid="match-scope-written-toggle"
				>
					{all ? 'Show fewer' : `Show ${folded} more`}
				</button>
			) : null}
		</div>
	);
}

/**
 * One test's rules: its title on the card's border as an input's label, the
 * counts and standing on the border's right end as the pickers' bins are,
 * then the warning where the eye lands, then a row per dimension.
 */
function Card({ card, listed, importantTags, ...rest }: CardProps) {
	const { test, standing, rules } = card;
	const count = test.result_ids.length;
	const { picks, setPicks } = rest;

	const border = (
		<>
			<div
				className={cn(
					'absolute top-[-11px] left-2 z-10 flex max-w-[60%] items-center px-1',
					FLOATING_LABEL_BACKDROP_CLASS
				)}
			>
				<TestTitle test={test} />
			</div>
			<div className="absolute top-[-11px] right-[21px] z-10 flex items-center gap-1 bg-bg-primary px-1">
				<StandingBadge standing={standing} />
				{/* Several results under one rule is worth saying too: it is what
				    narrowing was for. */}
				{rules.length > 1 || count > 1 ? (
					<Badge
						as="span"
						isInteractive={false}
						variant={BadgeVariants.Info}
						className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
						data-testid="match-scope-rules"
					>
						{rules.length} rule{rules.length > 1 ? 's' : ''}
					</Badge>
				) : null}
				<Badge
					as="span"
					isInteractive={false}
					variant={BadgeVariants.Info}
					className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
				>
					{count} result{count > 1 ? 's' : ''}
				</Badge>
				<IconButton
					name="Refresh"
					size={16}
					helpMessage="This test back to everything its results have"
					onClick={() => setPicks(resetTestPicks(picks, test.test_id))}
					className="!h-[22px] !w-[22px] -scale-x-100"
				/>
				<IconButton
					name="Bin"
					size={14}
					helpMessage="Empty this test's pickers: match on its path alone"
					onClick={() => setPicks(clearTestPicks(picks, test.test_id))}
					className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
				/>
			</div>
		</>
	);

	const fields = (
		<div className="flex flex-col gap-5">
			<Warnings standing={standing} />
			{/* The first picker's floating label and bin sit above its border;
			    give them room under the card's own border row. */}
			<div className={cn(standing.warnings.length ? '' : 'mt-2')}>
				<ParametersPicker card={card} {...rest} />
			</div>
			<VerdictsField card={card} {...rest} />
			{listed ? <RuleList rules={rules} importantTags={importantTags} /> : null}
		</div>
	);

	return (
		<section
			className="relative mt-3 rounded-lg border border-border-primary px-3 pb-3 pt-7"
			data-testid="match-scope-test"
			data-test-id={test.test_id}
		>
			{border}
			{fields}
		</section>
	);
}

function Cards({
	options,
	severalRuns,
	...rest
}: { options: ClassifyOptions; severalRuns: boolean } & PicksProps) {
	const { picks, setPicks, container } = rest;
	const cards: TestCard[] = testsOf(options).map((test) => ({
		test,
		standing: testStanding(test, picks),
		rules: flatRules(test, picks)
	}));
	const several = cards.length > 1;
	const rules = cards.reduce((sum, card) => sum + card.rules.length, 0);
	const offered = tagOptions(options);
	const importantTags = new Set(
		offered.filter((option) => option.important).map((option) => option.value)
	);
	const apart = tagsApart(options, picks).length;

	return (
		<>
			<div className="mt-2 flex flex-col gap-1.5">
				<ScopeValuePicker
					label="Tags"
					hint={MATCHER_HINTS.tags}
					options={offered}
					value={tagsPicked(options, picks)}
					onChange={(next) => setPicks({ ...picks, tags: next })}
					styleOf={tagStyle}
					emptyText={severalRuns ? 'none on these runs' : 'none on this run'}
					container={container}
					testId="match-scope-tags"
				/>
				{/* The one step that most often turns a rule per run into one
				    rule for them all. */}
				{apart ? (
					<p
						className="pl-2 text-xs text-text-menu"
						data-testid="match-scope-tags-apart"
					>
						{MATCH_SCOPE_COPY.tagsApart(apart)}{' '}
						<button
							type="button"
							onClick={() => setPicks(keepSharedTags(options, picks))}
							className="text-primary hover:underline"
							data-testid="match-scope-keep-shared"
						>
							{MATCH_SCOPE_COPY.keepShared}
						</button>
					</p>
				) : null}
			</div>

			{/* The label sits in the cards' own column: the first card's floating
			    title already keeps a margin above its border, so the label only
			    needs enough under it for that title to clear. */}
			<div className="flex flex-col gap-3">
				{several ? (
					<p className="-mb-1 pl-[14px] text-[0.6875rem] uppercase tracking-wider text-text-menu">
						{cards.length} tests,{' '}
						{rules === cards.length ? 'one rule each' : `${rules} rules`}
					</p>
				) : null}
				{cards.map((card) => (
					<Card
						key={card.test.test_id}
						card={card}
						listed={rules > 1}
						importantTags={importantTags}
						{...rest}
					/>
				))}
			</div>
		</>
	);
}

/**
 * What the rules written for these results will match on. The rules are as
 * specific as the results: `/results/classify/options/` gives one for the
 * results of a test with the same parameters in runs with the same important
 * tags, and each starts with all of its parameters, verdicts and important
 * tags kept. The pickers narrow all the rules of a test at once: a parameter
 * is kept or left out by name, the verdicts whole, and the tags once for the
 * form. Rules left matching on the same values become one. The card lists
 * every rule its test gets, with all the rule matches on. Emptying a field stops matching on it.
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
	const severalRuns = runs.length > 1;
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
	const specific = (options?.length ?? 0) > 1;

	return (
		// `pl-2`, as the section's headers and the fields' floating labels: the
		// text starts on that one line.
		<div className="flex flex-col gap-4" data-testid="match-scope">
			<p className="pl-2 text-xs text-text-menu">
				{specific
					? MATCH_SCOPE_COPY.specificHint
					: MATCH_SCOPE_COPY.sectionHint}
			</p>

			{isError ? (
				<p className="pl-2 text-xs text-text-unexpected">
					Could not load what{' '}
					{plural ? 'these results carry' : 'this result carries'}; saving tries
					again.
				</p>
			) : loading || !options ? (
				<div className="mt-2 flex flex-col gap-4">
					<Skeleton className="h-10 rounded-lg" />
					<Skeleton className="h-32 rounded-lg" />
				</div>
			) : (
				<Cards
					options={options}
					severalRuns={severalRuns}
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
