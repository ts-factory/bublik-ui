/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { ClassifyOptions } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	cn
} from '@/shared/tailwind-ui';

import { MATCH_SCOPE_COPY } from './match-scope.copy';
import {
	RuleActions,
	RuleBadges,
	RuleFields,
	SMALL_CHIP_CLASS,
	TestTitle,
	type PicksProps
} from './match-scope-rule.component';
import {
	ruleKey,
	rulesByPath,
	rulesWritten,
	sameAsEarlier,
	type PathRules
} from './match-scope.utils';

const SMALL_LABEL = 'text-[0.6875rem] uppercase tracking-wider text-text-menu';

/**
 * The card of one test path: the path on its border as an input's label,
 * how many rules and results it holds on the border's right end.
 */
function PathCard({
	group,
	children
}: {
	group: PathRules;
	children: ReactNode;
}) {
	const results = group.rules.reduce(
		(sum, { rule }) => sum + rule.result_ids.length,
		0
	);
	const runs = new Set(group.rules.flatMap(({ rule }) => rule.run_ids)).size;

	return (
		<section
			className="relative mt-3 rounded-lg border border-border-primary px-3 pb-3 pt-5"
			data-testid="match-scope-path"
		>
			<div
				className={cn(
					'absolute top-[-11px] left-2 z-10 flex max-w-[55%] items-center px-1',
					FLOATING_LABEL_BACKDROP_CLASS
				)}
			>
				<TestTitle
					path={group.path}
					hint={MATCH_SCOPE_COPY.testHint(results, runs)}
				/>
			</div>
			<div className="absolute top-[-11px] right-[21px] z-10 flex items-center gap-1 bg-bg-primary px-1">
				{group.rules.length > 1 ? (
					<Badge
						as="span"
						isInteractive={false}
						variant={BadgeVariants.Warning}
						className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
						data-testid="match-scope-path-rules"
					>
						{group.rules.length} rules
					</Badge>
				) : null}
				<Badge
					as="span"
					isInteractive={false}
					variant={BadgeVariants.Info}
					className={cn(SMALL_CHIP_CLASS, 'shrink-0')}
				>
					{results} result{results > 1 ? 's' : ''}
				</Badge>
			</div>
			{children}
		</section>
	);
}

interface MatchScopeRulesProps extends PicksProps {
	options: ClassifyOptions;
	/** Results classified just this once: the rules show, dimmed and inert. */
	readOnly: boolean;
}

/**
 * The rules the options give, a card per test path with its rules stacked
 * inside, so a path that gets several rules is seen at once. Each rule has
 * its badges and buttons on its own line, then its fields. Over the cards,
 * how many rules are stored.
 */
function MatchScopeRules({ options, readOnly, ...rest }: MatchScopeRulesProps) {
	const written = rulesWritten(options, rest.picks);

	return (
		<div
			className={cn('flex flex-col gap-3', readOnly && 'opacity-60')}
			data-readonly={readOnly}
			// Not typed by React 18; the browser takes the attribute as it is.
			{...(readOnly ? { inert: '' } : {})}
		>
			{options.length > 1 ? (
				<p
					className={cn('-mb-1 pl-2', SMALL_LABEL)}
					data-testid="match-scope-summary"
				>
					{written} rule{written > 1 ? 's' : ''}
				</p>
			) : null}
			{rulesByPath(options).map((group) => (
				<PathCard key={group.path} group={group}>
					<div className="flex flex-col">
						{group.rules.map(({ rule, index }, place) => (
							<div
								key={ruleKey(rule)}
								className={cn(
									'flex flex-col gap-4',
									place > 0 &&
										'mt-4 border-t border-dashed border-border-primary pt-3'
								)}
								data-testid="match-scope-test"
								data-test-id={rule.test_id}
								data-rule-key={ruleKey(rule)}
							>
								<div className="flex items-center gap-1 pl-[2px]">
									<span className={SMALL_LABEL}>
										{group.rules.length > 1 ? `Rule ${place + 1}` : 'Rule'}
									</span>
									<span className="flex-1" />
									<RuleBadges
										rule={rule}
										merged={sameAsEarlier(options, index, rest.picks)}
										picks={rest.picks}
									/>
									<RuleActions rule={rule} {...rest} />
								</div>
								<RuleFields rule={rule} {...rest} />
							</div>
						))}
					</div>
				</PathCard>
			))}
		</div>
	);
}

export { MatchScopeRules };
