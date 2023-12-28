/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Link } from 'react-router-dom';

import {
	HistoryDataLinear,
	HistorySearchParams,
	LogPageMode,
	RESULT_PROPERTIES,
	VERDICT_TYPE
} from '@/shared/types';
import { routes, stringifySearch, useSearchState } from '@/router';
import { ButtonTw, ContextLinks, Icon } from '@/shared/tailwind-ui';
import { DEFAULT_RESULT_TYPES } from '@/bublik/config';

export interface LinksProps {
	row: HistoryDataLinear;
}

export const Links = ({ row }: LinksProps) => {
	const [search] = useSearchState<HistorySearchParams>();
	const shortcuts = getHistorySearch(row, search);

	return (
		<div className="flex flex-col items-start gap-1">
			<ButtonTw asChild size="xss" variant="secondary">
				<Link
					to={routes.log({
						runId: row.run_id,
						focusId: row.result_id,
						mode: LogPageMode.InfoAndLog
					})}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</Link>
			</ButtonTw>
			<ButtonTw asChild size="xss" variant="secondary">
				<Link to={routes.run({ runId: row.run_id })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</Link>
			</ButtonTw>
			<ContextLinks
				sections={[
					{
						label: 'Shortcuts',
						items: [
							{
								label: 'All unexpected',
								to: {
									pathname: '/history',
									search: shortcuts.allUnexpected
								}
							},
							{
								label: 'Similar unexpected',
								to: {
									pathname: '/history',
									search: shortcuts.similarUnexpected
								}
							}
						]
					}
				]}
			>
				<ButtonTw
					asChild
					size="xss"
					variant="secondary"
					className="justify-start w-fit"
				>
					<Link
						className="justify-start w-fit"
						to={{ pathname: '/history', search: shortcuts.historyQuery }}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						History
					</Link>
				</ButtonTw>
			</ContextLinks>
			{row.has_measurements && (
				<ButtonTw asChild size="xss" variant="secondary">
					<Link
						to={routes.measurements({
							runId: row.run_id,
							resultId: row.result_id
						})}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Measure
					</Link>
				</ButtonTw>
			)}
		</div>
	);
};

const getHistorySearch = (
	row: HistoryDataLinear,
	search: HistorySearchParams
) => {
	const base: Partial<HistorySearchParams> = {
		testName: search.testName,
		mode: search.mode,
		page: '1',
		pageSize: search.pageSize,
		hash: search.hash,
		startDate: search.startDate,
		finishDate: search.finishDate,
		verdictLookup: VERDICT_TYPE.String,
		branches: search.branches,
		parameters: search.parameters,
		resultProperties: search.resultProperties,
		results: search.results
	};

	// 1. All unexpected
	// - All outcomes with unexpected
	// - With meta, tags, parameters
	const allUnexpected: HistorySearchParams = {
		...base,
		resultProperties: RESULT_PROPERTIES.Unexpected,
		runData: [
			...row.relevant_tags,
			...row.important_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		results: DEFAULT_RESULT_TYPES.join(';')
	};

	// 2. Similar unexpected
	// - All outcomes with unexpected
	// - With meta, tags, parameters
	// - With verdicts
	const similarUnexpected: HistorySearchParams = {
		...base,
		resultProperties: RESULT_PROPERTIES.Unexpected,
		runData: [
			...row.relevant_tags,
			...row.important_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		verdict: row.obtained_result.verdict.join(';'),
		results: DEFAULT_RESULT_TYPES.join(';')
	};

	// 3. History query
	const historyQuery: HistorySearchParams = {
		...base,
		runData: [
			...row.important_tags,
			...row.relevant_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		results: row.obtained_result.result_type,
		verdict: row.obtained_result.verdict.join(';'),
		runProperties: search.runProperties,
		resultProperties: row.has_error
			? RESULT_PROPERTIES.Unexpected
			: RESULT_PROPERTIES.Expected
	};

	return {
		allUnexpected: stringifySearch(allUnexpected),
		similarUnexpected: stringifySearch(similarUnexpected),
		historyQuery: stringifySearch(historyQuery)
	};
};
