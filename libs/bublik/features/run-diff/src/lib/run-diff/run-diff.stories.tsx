/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import type { StoryFn, Meta } from '@storybook/react';
import { ExpandedState, Row } from '@tanstack/react-table';

import { Primary as ResultDiffPrimary } from '../result-diff/result-diff.component.stories';
import { leftData, rightData } from './run-diff.mock';
import {
	RunDiff,
	RunDiffEmpty,
	RunDiffError,
	RunDiffLoading
} from './run-diff.component';
import { MergedRunDataWithDiff } from './run-diff.types';
import { ResultDiff } from '../result-diff';

const Story: Meta<typeof RunDiff> = {
	component: RunDiff,
	title: 'diff/Run Diff',
	parameters: { layout: 'padded', msw: { handlers: [] } },
	decorators: []
};
export default Story;

const Template: StoryFn<typeof RunDiff> = (args) => {
	const [expanded, setExpanded] = useState<ExpandedState>({
		'0': true,
		'0.2': true,
		'0.2.0': true
	});

	return (
		<RunDiff {...args} expanded={expanded} onExpandedChange={setExpanded} />
	);
};

export const Primary = {
	render: Template,

	args: {
		leftRoot: leftData[0],
		rightRoot: rightData[0],
		renderSubComponent: ({ row }: { row: Row<MergedRunDataWithDiff> }) => (
			<ResultDiff
				{...ResultDiffPrimary.args}
				leftRunId={'1'}
				rightRunId={'2'}
			/>
		)
	}
};

export const Loading = () => <RunDiffLoading />;
export const Error = () => <RunDiffError error={{ status: 404 }} />;
export const Empty = () => <RunDiffEmpty />;
