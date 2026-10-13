/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment, ReactNode } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	Icon,
	SplitButton,
	Tooltip,
	ButtonTw,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
	DropdownMenuPortal
} from '@/shared/tailwind-ui';
import type { HistorySearch } from '@/shared/utils';

import { withIssue } from './history-link.utils';

/** An issue the result carries, offered as one more history filter. */
export interface HistoryLinkIssue {
	issueId: number;
	/** Rendered by the caller, which knows how issues look. */
	label: ReactNode;
}

export interface HistoryLinkComponentProps {
	search: {
		direct: HistorySearch;
		prefilled: HistorySearch;
	} | null;
	issues?: HistoryLinkIssue[];
	isLoading?: boolean;
	isError?: boolean;
	disabled?: boolean;
}

type HistoryLinkItemAction =
	| 'direct_test_path'
	| 'direct_test_path_verdicts'
	| 'direct_test_path_parameters'
	| 'direct_test_path_parameters_important_tags'
	| 'direct_test_path_parameters_all_tags'
	| 'prefilled_test_path_verdicts'
	| 'prefilled_test_path_parameters_verdicts'
	| 'prefilled_test_path_parameters_important_tags';

type HistoryLinkAction =
	| 'open_menu'
	| 'direct_default'
	| HistoryLinkItemAction
	| `issue_${HistoryLinkItemAction}`;

const trackHistoryLinkClick = (action: HistoryLinkAction) => {
	trackEvent(analyticsEventNames.historyLinkComponentClick, { action });
};

interface HistoryLinkItem {
	searchKey: keyof HistorySearch;
	label: string;
	tooltip: string;
	action: HistoryLinkItemAction;
	isDefault?: boolean;
}

const DIRECT_ITEMS: HistoryLinkItem[] = [
	{
		searchKey: 'testName',
		label: 'Test Path',
		tooltip: 'Tells you how the test behaves with different parameters',
		action: 'direct_test_path'
	},
	{
		searchKey: 'testNameAndVerdicts',
		label: 'Test Path + Verdicts',
		tooltip:
			'Tells you if test was exposing the observed behaviour (if verdict exists) over time',
		action: 'direct_test_path_verdicts'
	},
	{
		searchKey: 'testNameAndParameters',
		label: 'Test Path + Parameters',
		tooltip:
			'Tells you how this specific test iteration (i.e. test with the same parameter values) behaves across all the runs',
		action: 'direct_test_path_parameters'
	},
	{
		searchKey: 'testNameAndParametersAndImportantTags',
		label: 'Test Path + Parameters + Important Tags',
		tooltip:
			'Tells you how this specific test iteration (i.e. test with the same parameter values) behaves in similar environment (based on what project defines as important)',
		action: 'direct_test_path_parameters_important_tags',
		isDefault: true
	},
	{
		searchKey: 'testNameAndParametersAndAllTags',
		label: 'Test Path + Parameters + All Tags',
		tooltip:
			"Tells you behaviour of the exact iteration (i.e. test with the same parameter values) under the exact conditions. Likely has very little runs in it, cause it's a super-restrictive search",
		action: 'direct_test_path_parameters_all_tags'
	}
];

const PREFILLED_ITEMS: HistoryLinkItem[] = [
	{
		searchKey: 'testNameAndVerdicts',
		label: 'Test Path + Verdicts',
		tooltip:
			'Tells you if test was exposing the observed behaviour (if verdict exists), you can add some parameters or tags by hands before searching',
		action: 'prefilled_test_path_verdicts'
	},
	{
		searchKey: 'testNameAndParametersAndVerdicts',
		label: 'Test Path + Parameters + Verdicts',
		tooltip:
			'Tells you behaviour of the test iteration (i.e. test with the same parameter values) over time. You can remove some parameters to widen the search before searching',
		action: 'prefilled_test_path_parameters_verdicts'
	},
	{
		searchKey: 'testNameAndParametersAndImportantTags',
		label: 'Test Path + Parameters + Important Tags',
		tooltip:
			'Tells you the behaviour of the test iteration (i.e. test with the same parameter values) in similar execution environment. You can remove some tags/parameters before doing the search',
		action: 'prefilled_test_path_parameters_important_tags'
	}
];

/**
 * Loading state component - shows a spinner button
 */
const LoadingState = () => (
	<ButtonTw variant="secondary" size="xss" state="loading" asChild>
		<LinkWithProject to="/history">
			<Icon
				name="ProgressIndicator"
				className="mr-1.5 animate-spin"
				size={20}
			/>
			History
		</LinkWithProject>
	</ButtonTw>
);

/**
 * Error/Disabled state component - shows a disabled button
 */
const ErrorState = () => (
	<ButtonTw variant="secondary" size="xss" state="disabled" asChild>
		<LinkWithProject to="/history">
			<Icon name="BoxArrowRight" className="mr-1.5" size={20} />
			History
		</LinkWithProject>
	</ButtonTw>
);

interface HistoryLinkItemsProps {
	direct: HistorySearch;
	prefilled: HistorySearch;
	/** Narrows every link to the results carrying this issue. */
	issueId?: number;
}

/** The Direct and Prefilled sections, optionally narrowed to one issue. */
const HistoryLinkItems = ({
	direct,
	prefilled,
	issueId
}: HistoryLinkItemsProps) => {
	const renderItem = (search: HistorySearch, item: HistoryLinkItem) => {
		const link =
			issueId === undefined
				? search[item.searchKey]
				: withIssue(search[item.searchKey], issueId);

		const content = (
			<SplitButton.Item asChild>
				<LinkWithProject
					{...link}
					onClick={() =>
						trackHistoryLinkClick(
							issueId === undefined ? item.action : `issue_${item.action}`
						)
					}
				>
					<Icon name="BoxArrowRight" size={20} className="text-primary" />
					{issueId === undefined ? (
						<span>
							{item.label}
							{item.isDefault ? (
								<>
									{' '}
									<strong>(Default)</strong>
								</>
							) : null}
						</span>
					) : (
						<span>{item.label} + Issue</span>
					)}
				</LinkWithProject>
			</SplitButton.Item>
		);

		// The tooltips explain the plain searches; the issue scope is the label
		if (issueId !== undefined) {
			return <Fragment key={item.searchKey}>{content}</Fragment>;
		}

		return (
			<Tooltip
				key={item.searchKey}
				content={item.tooltip}
				side="right"
				sideOffset={8}
			>
				{content}
			</Tooltip>
		);
	};

	return (
		<>
			<SplitButton.Label>Open Direct Search</SplitButton.Label>
			<SplitButton.Separator className="my-1" />
			{DIRECT_ITEMS.map((item) => renderItem(direct, item))}
			<SplitButton.Separator className="my-1" />
			<SplitButton.Label>Open Prefilled Form</SplitButton.Label>
			<SplitButton.Separator className="my-1" />
			{PREFILLED_ITEMS.map((item) => renderItem(prefilled, item))}
		</>
	);
};

interface IssueHistoryItemsProps {
	issues: HistoryLinkIssue[];
	direct: HistorySearch;
	prefilled: HistorySearch;
}

/** One submenu per issue, each holding the history options narrowed to it. */
const IssueHistoryItems = ({
	issues,
	direct,
	prefilled
}: IssueHistoryItemsProps) => {
	return (
		<>
			<SplitButton.Label>Open Search By Issue</SplitButton.Label>
			<SplitButton.Separator className="my-1" />
			{issues.map(({ issueId, label }) => (
				<DropdownMenuSub key={issueId}>
					<DropdownMenuSubTrigger
						className="text-xs gap-2 max-w-[360px] [&>svg:last-child]:size-5 [&>svg:last-child]:shrink-0"
						data-testid="history-link-issue"
						data-issue-id={issueId}
					>
						<Icon
							name="IssueIcon"
							size={20}
							className="text-primary shrink-0"
						/>
						{label}
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent
							sideOffset={6}
							className="z-[101] min-w-[260px]"
						>
							<HistoryLinkItems
								direct={direct}
								prefilled={prefilled}
								issueId={issueId}
							/>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
			))}
			<SplitButton.Separator className="my-1" />
		</>
	);
};

const HistoryLinkComponent = (props: HistoryLinkComponentProps) => {
	const { search, issues, isLoading, isError, disabled } = props;

	if (isLoading) return <LoadingState />;

	if (isError || disabled || !search) return <ErrorState />;

	const { direct, prefilled } = search;

	return (
		<SplitButton.Root variant="secondary" size="xss">
			<SplitButton.Button asChild>
				<LinkWithProject
					{...direct.testNameAndParametersAndImportantTags}
					onClick={() => trackHistoryLinkClick('direct_default')}
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
			<SplitButton.Trigger onClick={() => trackHistoryLinkClick('open_menu')}>
				<Icon name="ArrowShortTop" size={18} className="rotate-180" />
			</SplitButton.Trigger>
			<SplitButton.Content align="start">
				{issues?.length ? (
					<IssueHistoryItems
						issues={issues}
						direct={direct}
						prefilled={prefilled}
					/>
				) : null}
				<HistoryLinkItems direct={direct} prefilled={prefilled} />
			</SplitButton.Content>
		</SplitButton.Root>
	);
};

export { HistoryLinkComponent };
