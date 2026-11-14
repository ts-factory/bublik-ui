/* SPDX-License-Identifier: Apache-2.0 */
import { useMemo, type RefObject } from 'react';
import { useWatch } from 'react-hook-form';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetClassifyOptionsQuery } from '@/services/bublik-api';
import { Skeleton, cn } from '@/shared/tailwind-ui';

import type { ClassifyForm } from '../classify/classify-form.types';
import type { RunResults } from '../classify/result-selection.utils';
import { MATCH_SCOPE_COPY, RUN_MATCH_SCOPE_COPY } from './match-scope.copy';
import { RunMatchScope } from './match-scope-run.component';
import { MatchScopeRules } from './match-scope-rules.component';
import { ofOneRun, type ScopePicks } from './match-scope.utils';

/**
 * What the rules written for these results will match on. The rules are
 * those `/results/classify/options/` gives, and the section is their list:
 * a card per test path with its rules stacked inside, each rule starting
 * with all the parameters its results share, their verdicts and the
 * important tags of their runs, and each narrowed on its own, in place.
 * Emptying a field stops matching on it. Rules left matching on the same
 * values are stored as one, which the later rule says.
 *
 * Results of one run keep the form they had before a selection could span
 * runs: the run's tags once, then a card per test with its rule.
 *
 * Results classified just this once get rules saved switched off, which
 * future runs never meet. The rules still show, so the reader sees what is
 * saved, but they are not edited.
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

	const oneoff = scope === 'oneoff';
	const setPicks = (next: ScopePicks) =>
		form.setValue('picks', next, { shouldDirty: true });
	const loading = isLoading || (count > 0 && !options && !isError);
	const several = (options?.length ?? 0) > 1;
	// Known before the options arrive, so the hint does not change under them.
	const oneRun = runs.length === 1;

	return (
		// `pl-2`, as the section's headers and the fields' floating labels: the
		// text starts on that one line.
		<div
			className={cn('flex flex-col', oneRun ? 'gap-4' : 'gap-3')}
			data-testid="match-scope"
		>
			{oneoff ? (
				<p
					className="pl-2 text-xs text-text-menu"
					data-testid="match-scope-oneoff"
				>
					{MATCH_SCOPE_COPY.oneoffHint(several, plural)}
				</p>
			) : oneRun ? (
				<div className="flex flex-col pl-2 text-xs text-text-menu">
					<p>{RUN_MATCH_SCOPE_COPY.sectionHint}</p>
					{several ? <p>{RUN_MATCH_SCOPE_COPY.severalHint}</p> : null}
				</div>
			) : (
				<p className="pl-2 text-xs text-text-menu">
					{several
						? MATCH_SCOPE_COPY.specificHint
						: MATCH_SCOPE_COPY.sectionHint}
				</p>
			)}

			{isError ? (
				<p className="pl-2 text-xs text-text-unexpected">
					Could not load what{' '}
					{plural ? 'these results carry' : 'this result carries'}; saving tries
					again.
				</p>
			) : loading || !options ? (
				<div className="mt-2 flex flex-col gap-4">
					<Skeleton className={cn('rounded-lg', oneRun ? 'h-10' : 'h-24')} />
					<Skeleton className={cn('rounded-lg', oneRun ? 'h-32' : 'h-24')} />
				</div>
			) : oneRun && ofOneRun(options) ? (
				<RunMatchScope
					options={options}
					readOnly={oneoff}
					picks={picks as ScopePicks}
					setPicks={setPicks}
					container={container}
				/>
			) : (
				<MatchScopeRules
					options={options}
					readOnly={oneoff}
					picks={picks as ScopePicks}
					setPicks={setPicks}
					container={container}
				/>
			)}
		</div>
	);
}
