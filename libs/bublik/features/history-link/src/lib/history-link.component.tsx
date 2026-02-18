/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Icon, SplitButton, Tooltip, ButtonTw } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import type { HistorySearch } from '@/shared/utils';

export interface HistoryLinkComponentProps {
	search: {
		direct: HistorySearch;
		prefilled: HistorySearch;
	} | null;
	isLoading?: boolean;
	isError?: boolean;
	disabled?: boolean;
}

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

export const HistoryLinkComponent = (props: HistoryLinkComponentProps) => {
	const { search, isLoading, isError, disabled } = props;

	if (isLoading) return <LoadingState />;

	if (isError || disabled || !search) return <ErrorState />;

	const { direct, prefilled } = search;

	return (
		<SplitButton.Root variant="secondary" size="xss">
			<SplitButton.Button asChild>
				<LinkWithProject {...direct.testNameAndParametersAndImportantTags}>
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
				<Icon name="ArrowShortTop" size={18} className="rotate-180" />
			</SplitButton.Trigger>
			<SplitButton.Content align="start">
				<SplitButton.Label>Open Direct Search</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="Tells you how the test behaves with different parameters"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...direct.testName}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you if test was exposing the observed behaviour (if verdict exists) over time"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...direct.testNameAndVerdicts}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Verdicts</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you how this specific test iteration (i.e. test with the same parameter values) behaves across all the runs"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...direct.testNameAndParameters}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Parameters</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you how this specific test iteration (i.e. test with the same parameter values) behaves in similar environment (based on what project defines as important)"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...direct.testNameAndParametersAndImportantTags}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>
								Test Path + Parameters + Important Tags{' '}
								<strong>(Default)</strong>
							</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you behaviour of the exact iteration (i.e. test with the same parameter values) under the exact conditions. Likely has very little runs in it, cause it's a super-restrictive search"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...direct.testNameAndParametersAndAllTags}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Parameters + All Tags</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<SplitButton.Separator className="my-1" />
				<SplitButton.Label>Open Prefilled Form</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<Tooltip
					content="Tells you if test was exposing the observed behaviour (if verdict exists), you can add some parameters or tags by hands before searching"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...prefilled.testNameAndVerdicts}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Verdicts</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
				<Tooltip
					content="Tells you behaviour of the test iteration (i.e. test with the same parameter values) over time. You can remove some parameters to widen the search before searching"
					side="right"
					sideOffset={8}
				>
					<SplitButton.Item asChild>
						<LinkWithProject {...prefilled.testNameAndParametersAndVerdicts}>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Parameters + Verdicts</span>
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
							{...prefilled.testNameAndParametersAndImportantTags}
						>
							<Icon name="BoxArrowRight" size={20} className="text-primary" />
							<span>Test Path + Parameters + Important Tags</span>
						</LinkWithProject>
					</SplitButton.Item>
				</Tooltip>
			</SplitButton.Content>
		</SplitButton.Root>
	);
};
