/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta, StoryObj } from '@storybook/react';

import { RUN_STATUS } from '@/shared/types';

import {
	SelectedResultItem,
	SelectionPopover
} from './selection-popover.component';
import { MemoryRouter } from 'react-router-dom';

const Story: Meta<typeof SelectionPopover> = {
	component: SelectionPopover,
	title: 'runs/Selection Popover',
	decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>]
};
export default Story;

const Template: StoryFn<typeof SelectionPopover> = (args) => {
	return <SelectionPopover {...args} />;
};

type Story = StoryObj<typeof SelectionPopover>;

export const Primary: Story = {
	render: Template,

	args: {
		compareIds: ['compare-1', 'compare-2'],
		renderItem: (runId) => (
			<SelectedResultItem name="test" start={''} status={RUN_STATUS.Busy} />
		)
	}
};
