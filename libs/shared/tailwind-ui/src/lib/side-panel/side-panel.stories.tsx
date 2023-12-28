/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { ButtonTw } from '../button';
import {
	Panel,
	PanelContent,
	PanelClose,
	PanelDescription,
	PanelTitle,
	PanelTrigger
} from './side-panel';

export default {
	component: Panel,
	title: 'components/Side Panel',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof Panel>;

const Template: StoryFn<typeof Panel> = (args) => (
	<Panel {...args}>
		<PanelTrigger asChild>
			<ButtonTw size="xss" variant="secondary">
				Open Side-panel
			</ButtonTw>
		</PanelTrigger>
		<PanelContent isOpen={true}>
			<PanelTitle>Hello dialog</PanelTitle>
			<PanelDescription>Some description</PanelDescription>
			<PanelClose>Close</PanelClose>
		</PanelContent>
	</Panel>
);

export const Primary = {
	render: Template,
	args: {}
};
