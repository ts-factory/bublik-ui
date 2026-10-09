/* SPDX-License-Identifier: Apache-2.0 */
import type { RefObject } from 'react';
import { useWatch } from 'react-hook-form';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetClassifyOptionsQuery } from '@/services/bublik-api';
import type {
	ClassifyMatcher,
	ClassifyOptions,
	ClassifyOptionsTest
} from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	FormSectionError,
	Icon,
	IconButton,
	Skeleton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import type { ClassifyForm } from '../classify/classify-form.types';
import {
	ScopeValuePicker,
	type ScopeValueStyle
} from '../pickers/scope-value-picker.component';
import { VerdictLists } from '../pickers/verdict-lists.component';
import { MATCH_SCOPE_COPY } from './match-scope.copy';
import { MATCHER_HINTS } from './matcher-fields.utils';
import {
	clearTestPicks,
	matcherForTest,
	parameterOptions,
	parametersPicked,
	resetTestPicks,
	rulesForTest,
	setTestPick,
	tagOptions,
	tagsPicked,
	testStanding,
	verdictsKept,
	type ScopeOption,
	type ScopePicks,
	type TestStanding
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

/**
 * The scale of the result table's small uppercase chips, a notch under the
 * classification meta badge: these sit on a card's border beside its title.
 */
const SMALL_CHIP_CLASS =
	'px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem]';

interface TestCard {
	test: ClassifyOptionsTest;
	matcher: ClassifyMatcher;
	standing: TestStanding;
	/** How many rules the test gets per category. */
	rules: number;
}

interface PicksProps {
	picks: ScopePicks;
	setPicks: (next: ScopePicks) => void;
	container?: RefObject<HTMLElement>;
}

/** The test's path: package dimmed, the test itself in bold. */
function TestTitle({ test }: { test: ClassifyOptionsTest }) {
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
					? 'none shared by its results'
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
			lists={test.verdicts}
			kept={verdictsKept(test, picks)}
			onChange={(kept) =>
				setPicks(setTestPick(picks, test.test_id, { verdicts: kept }))
			}
			testId="match-scope-verdicts"
		/>
	);
}

/**
 * One test's rules: its title on the card's border as an input's label, the
 * counts and standing on the border's right end as the pickers' bins are,
 * then the warning where the eye lands, then a row per dimension.
 */
function Card({ card, ...rest }: { card: TestCard } & PicksProps) {
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
			<div className="absolute top-[-11px] right-[21px] z-10 flex items-center gap-1 bg-white px-1">
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
				>
					{count} result{count > 1 ? 's' : ''}
				</Badge>
				<IconButton
					name="Refresh"
					size={16}
					helpMessage="This test back to what its results share"
					onClick={() => setPicks(resetTestPicks(picks, test.test_id))}
					className="!h-[22px] !w-[22px] -scale-x-100"
				/>
				<IconButton
					name="Bin"
					size={14}
					helpMessage="Empty this test's pickers: match on its path alone"
					onClick={() => setPicks(clearTestPicks(picks, test.test_id))}
					className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-red-100"
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
	...rest
}: { options: ClassifyOptions } & PicksProps) {
	const { picks, setPicks, container } = rest;
	const cards: TestCard[] = options.tests.map((test) => {
		const matcher = matcherForTest(test, options, picks);

		return {
			test,
			matcher,
			standing: testStanding(test, matcher),
			rules: rulesForTest(test, picks)
		};
	});
	const several = cards.length > 1;
	const rules = cards.reduce((sum, card) => sum + card.rules, 0);

	return (
		<>
			<div className="mt-2">
				<ScopeValuePicker
					label="Tags"
					hint={MATCHER_HINTS.tags}
					options={tagOptions(options)}
					value={tagsPicked(options, picks)}
					onChange={(next) => setPicks({ ...picks, tags: next })}
					styleOf={tagStyle}
					emptyText="none on this run"
					container={container}
					testId="match-scope-tags"
				/>
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
					<Card key={card.test.test_id} card={card} {...rest} />
				))}
			</div>
		</>
	);
}

/**
 * What the rules written for these results will match on: the run's tags,
 * shared by every rule, then a card per test holding the values its own
 * rules keep. The Parameters picker offers only what
 * `/results/classify/options/` says the test's results share, and starts
 * with all of it, the tags with the run's important ones; the verdicts are
 * matched exactly, so the card keeps every list its results failed with, a
 * rule per list, or drops them. Emptying a field stops matching on it.
 *
 * Results classified just this once get rules saved switched off, which
 * future runs never meet, so there is nothing to scope and the cards fold
 * away; what was picked is kept for a switch back.
 */
export function MatchScope({
	form,
	resultIds,
	container
}: {
	form: ClassifyForm;
	resultIds: number[];
	container?: RefObject<HTMLElement>;
}) {
	const {
		data: options,
		isLoading,
		isError
	} = useGetClassifyOptionsQuery(resultIds.length ? { resultIds } : skipToken);
	const [scope, picks] = useWatch({
		control: form.control,
		name: ['scope', 'picks']
	});
	const plural = resultIds.length > 1;

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

	const loading = isLoading || (resultIds.length > 0 && !options && !isError);
	const several = (options?.tests.length ?? 0) > 1;

	return (
		// `pl-2`, as the section's headers and the fields' floating labels: the
		// text starts on that one line.
		<div className="flex flex-col gap-4" data-testid="match-scope">
			<div className="flex flex-col pl-2 text-xs text-text-menu">
				<p>{MATCH_SCOPE_COPY.sectionHint}</p>
				{several ? <p>{MATCH_SCOPE_COPY.severalHint}</p> : null}
			</div>

			{isError ? (
				<p className="pl-2 text-xs text-text-unexpected">
					Could not load what{' '}
					{plural ? 'these results share' : 'this result carries'}; saving keeps
					all of it.
				</p>
			) : loading || !options ? (
				<div className="mt-2 flex flex-col gap-4">
					<Skeleton className="h-10 rounded-lg" />
					<Skeleton className="h-32 rounded-lg" />
				</div>
			) : (
				<Cards
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
