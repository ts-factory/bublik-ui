/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';

import {
	ToolbarButton,
	Toolbar,
	ToolbarToggleGroup,
	ToolbarToggleItem,
	toolbarToggleGroupStyles
} from './toolbar';
import { Icon } from '../icon';
import { withBackground } from '../storybook-bg';

const Story = {
	component: Toolbar,
	title: 'components/Toolbar',
	decorators: [withBackground]
} satisfies Meta<typeof Toolbar>;
export default Story;

export const Primary = () => {
	return (
		<Toolbar className="flex items-center gap-4">
			<ToolbarToggleGroup type="single">
				<ToolbarToggleItem value="one">
					<Icon name="SettingsSliders" size={20} />
				</ToolbarToggleItem>
				<ToolbarToggleItem value="two">
					<Icon name="MagnifyingGlass" size={20} />
				</ToolbarToggleItem>
			</ToolbarToggleGroup>
			<div className={toolbarToggleGroupStyles()}>
				<ToolbarButton>
					<Icon name="Refresh" size={20} />
				</ToolbarButton>
			</div>
		</Toolbar>
	);
};
