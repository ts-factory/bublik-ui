/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

import { RESULT_TYPE, ResultData, ResultDataArrayObj } from '@/shared/types';
import {
	badgeBaseStyles,
	BadgeListItem,
	BadgeVariants,
	badgeVariantStyles,
	cn,
	ListOfVerdicts,
	VerdictResult,
	VerdictVariant
} from '@/shared/tailwind-ui';
import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	ClassifyResultContainer,
	isClassifiable,
	useResultSelection
} from '@/bublik/features/result-classification';

import { AggregationTooltip } from '../aggregation-tooltip';
import { HistoryContextMenuContainer } from '../../../history-context-menu';
import { verdictGroupResults } from '../../history-aggregation.utils';

/** What a click lands on that is a control of its own, not the group. */
const INTERACTIVE_SELECTOR =
	'button, a, input, select, textarea, [role="button"], [data-stop-row-click="true"]';

interface VerdictGroupProps {
	group: ResultData;
	children: ReactNode;
}

/**
 * A verdict group of a group-of-results row. Under a result selection a
 * click on it, clear of its badges and links, picks every result in it, and
 * a click on a fully picked group drops them; a group of expected results,
 * which Classify could not take, is not picked.
 */
function VerdictGroup({ group, children }: VerdictGroupProps) {
	const selection = useResultSelection();
	const results = verdictGroupResults(group);
	const pickedCount = results.filter((result) =>
		selection?.isSelected(result.result_id)
	).length;
	const isSelected = results.length > 0 && pickedCount === results.length;
	const isPickable =
		selection !== null &&
		(pickedCount > 0 || results.some((result) => isClassifiable(result)));

	function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
		const target = event.target as HTMLElement;

		// React bubbles clicks out of portals too: an item of the group's filter
		// menu is not a click on the group.
		if (!event.currentTarget.contains(target)) return;
		if (target.closest(INTERACTIVE_SELECTOR)) return;
		if (!selection || !isPickable) return;

		if (isSelected) {
			selection.deselect(results.map((result) => result.result_id));
		} else {
			selection.select(results);
		}
	}

	return (
		<div
			className={cn(
				'flex flex-col gap-1 -mx-1 -my-0.5 px-1 py-0.5 rounded-md border border-transparent transition-colors',
				isPickable && 'cursor-pointer hover:border-primary',
				isSelected && 'border-primary'
			)}
			onClick={handleClick}
			data-testid="history-verdict-group"
			data-result-ids={results.map((result) => result.result_id).join(',')}
			data-selectable={isPickable ? '' : undefined}
			data-selected={isSelected ? '' : undefined}
		>
			{children}
		</div>
	);
}

export interface LinkListProps {
	results: ResultDataArrayObj[];
	/** The group failed: each iteration's card offers Classify. */
	hasError?: boolean;
}

export const LinkList = ({ results, hasError = false }: LinkListProps) => {
	return (
		<div className="flex flex-wrap gap-1">
			{results.map((resultData, idx) => {
				const to = routes.log({
					runId: resultData.run_id,
					focusId: resultData.result_id
				});

				return (
					<AggregationTooltip
						key={resultData.result_id}
						relevantTags={resultData.relevant_tags}
						importantTags={resultData.important_tags}
						startDate={resultData.start_date}
						renderAction={
							hasError
								? (keepOpen) => (
										<ClassifyResultContainer
											resultId={resultData.result_id}
											runId={resultData.run_id}
											onOpenChange={keepOpen}
										/>
								  )
								: undefined
						}
					>
						<LinkWithProject
							to={to}
							state={{ fromHistory: true }}
							className={cn(
								badgeBaseStyles(),
								badgeVariantStyles({
									variant: BadgeVariants.Primary
								}),
								'hover:underline'
							)}
						>
							{idx + 1}
						</LinkWithProject>
					</AggregationTooltip>
				);
			})}
		</div>
	);
};

export interface ResultListProps {
	results: ResultData[];
	selectedVerdicts: string[];
	onVerdictClick: (badge: BadgeListItem) => void;
	onResultClick: (result: RESULT_TYPE, isNotExpected: boolean) => void;
	selectedResultType: {
		resultType: RESULT_TYPE | null;
		isNotExpected: boolean | null;
	};
}

export const ResultList = (props: ResultListProps) => {
	const {
		results,
		selectedVerdicts,
		onVerdictClick,
		onResultClick,
		selectedResultType: {
			resultType: selectedResultType,
			isNotExpected: selectedIsNotExpected
		}
	} = props;

	return (
		// Each group's border sits 2px out from its rows: the gap leaves room
		// for two of them, so neighbouring picks do not overlap.
		<div className="flex flex-col gap-1.5">
			{results.map((result, idx) => (
				<HistoryContextMenuContainer
					key={idx}
					badges={result.verdict.map((verdict) => ({ payload: verdict }))}
					filterKey="verdicts"
					label="verdicts"
					isNotExpected={result.has_error}
					resultType={result.result_type}
				>
					<VerdictGroup group={result}>
						<VerdictResult
							variant={VerdictVariant.Obtained}
							resultType={result.result_type}
							isNotExpected={result.has_error}
							onResultClick={(resultType) =>
								onResultClick(resultType, result.has_error)
							}
							isSelected={
								selectedResultType === result.result_type &&
								selectedIsNotExpected === result.has_error
							}
						/>
						<ListOfVerdicts
							verdicts={result.verdict}
							selectedVerdicts={selectedVerdicts}
							onVerdictClick={(verdict) => onVerdictClick({ payload: verdict })}
						/>
						<LinkList
							results={result.results_data}
							hasError={result.has_error}
						/>
					</VerdictGroup>
				</HistoryContextMenuContainer>
			))}
		</div>
	);
};
