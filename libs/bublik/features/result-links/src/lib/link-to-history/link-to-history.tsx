/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Link } from 'react-router-dom';

import { getHistorySearch } from '@/shared/utils';
import {
	RunDetailsAPIResponse,
	HistoryMode,
	RunDataResults
} from '@/shared/types';
import { Icon, SplitButton, Tooltip } from '@/shared/tailwind-ui';

export interface LinkToHistoryProps {
	result: RunDataResults;
	runDetails: RunDetailsAPIResponse;
	userPreferredHistoryMode?: HistoryMode;
}

export const LinkToHistory = (props: LinkToHistoryProps) => {
	const { runDetails, result, userPreferredHistoryMode = 'linear' } = props;
	const search = getHistorySearch(runDetails, result, userPreferredHistoryMode);
	const prefilled = { pathname: '/history', search: search.prefilled };

	return (
		<SplitButton.Root variant="secondary" size="xss">
			<SplitButton.Button asChild>
				<Link to={prefilled} state={{ fromRun: true }} className="">
					<Icon
						name="BoxArrowRight"
						size={20}
						className="grid place-items-center mr-1"
					/>
					<span>History</span>
				</Link>
			</SplitButton.Button>
			<SplitButton.Separator orientation="vertical" className="h-5" />
			<SplitButton.Trigger>
				<Icon name="ChevronDown" size={14} />
			</SplitButton.Trigger>
			<SplitButton.Content align="start">
				<SplitButton.Label>Prefilled</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="View history with all tags, test parameters, and verdicts prefilled"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<Link
							to={{ pathname: '/history', search: search.prefilled }}
							state={{ fromRun: true }}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>All Parameters</span>
						</Link>
					</SplitButton.Item>
				</Tooltip>
				<SplitButton.Separator className="my-1" />
				<SplitButton.Label>Direct</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="View history for this test name with all default settings"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<Link to={{ pathname: '/history', search: search.byTestName }}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name</span>
						</Link>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="View history for this test name with parameters"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<Link to={{ pathname: '/history', search: search.byIteration }}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Iteration</span>
						</Link>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="View history for this test with important tags and parameters"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<Link
							to={{
								pathname: '/history',
								search: search.byIterationWithImportant
							}}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Iteration And Important</span>
						</Link>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="View history for this test with all tags and parameters"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<Link
							to={{
								pathname: '/history',
								search: search.byIterationWithAllTags
							}}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Iteration And Tags</span>
						</Link>
					</SplitButton.Item>
				</Tooltip>
			</SplitButton.Content>
		</SplitButton.Root>
	);
};
