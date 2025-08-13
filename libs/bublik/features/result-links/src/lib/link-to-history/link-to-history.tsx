/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getHistorySearch } from '@/shared/utils';
import {
	RunDetailsAPIResponse,
	HistoryMode,
	RunDataResults
} from '@/shared/types';
import { Icon, SplitButton, Tooltip } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinkToHistoryProps {
	result: RunDataResults;
	runDetails: RunDetailsAPIResponse;
	userPreferredHistoryMode?: HistoryMode;
}

export const LinkToHistory = (props: LinkToHistoryProps) => {
	const { runDetails, result, userPreferredHistoryMode = 'linear' } = props;
	const search = getHistorySearch(runDetails, result, userPreferredHistoryMode);

	return (
		<SplitButton.Root variant="secondary" size="xss">
			<SplitButton.Button asChild>
				<LinkWithProject
					{...search.prefilled.testNameAndParametersAndImportantTags}
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
				<SplitButton.Label>Open Prefilled Form</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="Tells you if test was exposing the observed behaviour (if verdict exists), you can add some parameters or tags by hands before searching"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...search.prefilled.testNameAndVerdicts}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Verdicts</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you behaviour of the test iteration (i.e. test with the same parameter values) over time. You can remove some parameters to widen the search before searching"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject
							{...search.prefilled.testNameAndParametersAndVerdicts}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Parameters + Verdicts</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you the behaviour of the test iteration (i.e. test with the same parameter values) in similar execution environment. You can remove some tags/parameters before doing the search"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject
							{...search.prefilled.testNameAndParametersAndImportantTags}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Parameters + Important Tags (Default)</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<SplitButton.Separator className="my-1" />
				<SplitButton.Label>Open Direct Search</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="Tells you how the test behaves with different parameters"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...search.direct.testName}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you if test was exposing the observed behaviour (if verdict exists) over time"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...search.direct.testNameAndVerdicts}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Verdicts</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you how this specific test iteration (i.e. test with the same parameter values) behaves across all the runs"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...search.direct.testNameAndParameters}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Parameters</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you how this specific test iteration (i.e. test with the same parameter values) behaves in similar environment (based on what project defines as important)"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject
							{...search.direct.testNameAndParametersAndImportantTags}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Parameters + Important Tags</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you behaviour of the exact iteration (i.e. test with the same parameter values) under the exact conditions. Likely has very little runs in it, cause it's a super-restrictive search"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...search.direct.testNameAndParametersAndAllTags}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Name + Parameters + All Tags</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
			</SplitButton.Content>
		</SplitButton.Root>
	);
};
