/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
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

import { AggregationTooltip } from '../aggregation-tooltip';
import { HistoryContextMenuContainer } from '../../../history-context-menu';

export interface LinkListProps {
	results: ResultDataArrayObj[];
}

export const LinkList = ({ results }: LinkListProps) => {
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
						badges={resultData.relevant_tags}
						startDate={resultData.start_date}
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
		<div className="flex flex-col gap-1">
			{results.map((result, idx) => (
				<HistoryContextMenuContainer
					key={idx}
					badges={result.verdict.map((verdict) => ({ payload: verdict }))}
					filterKey="verdicts"
					label="verdicts"
					isNotExpected={result.has_error}
					resultType={result.result_type}
				>
					<div key={idx} className="flex flex-col gap-1">
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
						<LinkList results={result.results_data} />
					</div>
				</HistoryContextMenuContainer>
			))}
		</div>
	);
};
