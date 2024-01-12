/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import {
	ResultDiff,
	ResultDiffEmpty,
	ResultDiffError,
	ResultDiffLoading
} from './result-diff.component';

const Story: Meta<typeof ResultDiff> = {
	component: ResultDiff,
	title: 'diff/Result Diff',
	parameters: { layout: 'padded', msw: { handlers: [] } },
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/runs/compare']}>{Story()}</MemoryRouter>
		)
	]
};
export default Story;

type Story = StoryObj<typeof Story>;
export const Primary: Story = {
	args: {
		leftRunId: '1',
		rightRunId: '2',
		left: [],
		right: []
	}
};

export const Loading = () => <ResultDiffLoading />;
export const Error = () => <ResultDiffError />;
export const Empty = () => <ResultDiffEmpty />;
