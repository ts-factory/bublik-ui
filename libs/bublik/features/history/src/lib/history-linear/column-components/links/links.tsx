/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	HistoryDataLinear,
	HistorySearchParams,
	LogPageMode,
	RESULT_PROPERTIES,
	VERDICT_TYPE
} from '@/shared/types';
import { routes, stringifySearch, useSearchState } from '@/router';
import { ButtonTw, Icon, SplitButton, Tooltip } from '@/shared/tailwind-ui';
import { DEFAULT_RESULT_TYPES } from '@/bublik/config';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinksProps {
	row: HistoryDataLinear;
}

export const Links = ({ row }: LinksProps) => {
	const [search] = useSearchState<HistorySearchParams>();
	const shortcuts = getHistorySearch(row, search);

	return (
		<div className="flex flex-col items-start gap-1">
			<ButtonTw asChild size="xss" variant="secondary">
				<LinkWithProject
					to={routes.log({
						runId: row.run_id,
						focusId: row.result_id,
						mode: LogPageMode.InfoAndLog
					})}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild size="xss" variant="secondary">
				<LinkWithProject
					to={routes.run({
						runId: row.run_id,
						targetIterationId: Number(row.result_id)
					})}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
			<SplitButton.Root variant="secondary" size="xss">
				<SplitButton.Button asChild>
					<LinkWithProject
						to={{ pathname: '/history', search: shortcuts.historyQuery }}
					>
						<Icon
							name="BoxArrowRight"
							size={20}
							className="grid place-items-center mr-1"
						/>
						<span>History</span>
					</LinkWithProject>
				</SplitButton.Button>
				<SplitButton.Separator orientation="vertical" className="h-5" />
				<SplitButton.Trigger>
					<Icon name="ChevronDown" size={14} />
				</SplitButton.Trigger>
				<SplitButton.Content align="start">
					<SplitButton.Label>Shortcuts</SplitButton.Label>
					<SplitButton.Separator className="my-1" />
					<Tooltip
						side="right"
						sideOffset={12}
						content="All unexpected with (meta, tags, parameters)"
					>
						<SplitButton.Item asChild>
							<LinkWithProject
								to={{ pathname: '/history', search: shortcuts.allUnexpected }}
								target="_blank"
							>
								<Icon name="ExternalLink" size={16} className="text-primary" />
								<span>All Unexpected</span>
							</LinkWithProject>
						</SplitButton.Item>
					</Tooltip>

					<Tooltip
						side="right"
						sideOffset={12}
						content="All unexpected with (meta, tags, parameters, verdicts)"
					>
						<SplitButton.Item asChild>
							<LinkWithProject
								to={{
									pathname: '/history',
									search: shortcuts.similarUnexpected
								}}
								target="_blank"
							>
								<Icon name="ExternalLink" size={16} className="text-primary" />
								<span>Similar Unexpected</span>
							</LinkWithProject>
						</SplitButton.Item>
					</Tooltip>
				</SplitButton.Content>
			</SplitButton.Root>
			{row.has_measurements && (
				<ButtonTw asChild size="xss" variant="secondary">
					<LinkWithProject
						to={routes.measurements({
							runId: row.run_id,
							resultId: row.result_id
						})}
					>
						<Icon name="BoxArrowRight" className="mr-1.5" />
						Result
					</LinkWithProject>
				</ButtonTw>
			)}
			<LogPreviewContainer
				runId={Number(row.run_id)}
				resultId={Number(row.result_id)}
				measurementId={row.has_measurements ? Number(row.result_id) : undefined}
			>
				<ButtonTw
					size="xss"
					variant="secondary"
					className="justify-start w-fit"
				>
					<Icon name="ExpandSelection" className="mr-1.5" size={20} />
					<span>Preview</span>
				</ButtonTw>
			</LogPreviewContainer>
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
		verdict: row.obtained_result.verdicts.join(';'),
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
		verdict: row.obtained_result.verdicts.join(';'),
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
