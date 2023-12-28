/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { ButtonTw } from '../button';
import {
	Dialog,
	DialogContent,
	DialogClose,
	DialogDescription,
	DialogTitle,
	DialogTrigger
} from './dialog';

export default {
	component: Dialog,
	title: 'components/Dialog',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	],
	parameters: { layout: 'centered' }
} as Meta<typeof Dialog>;

const Template: StoryFn<typeof Dialog> = (args) => (
	<Dialog {...args}>
		<DialogTrigger asChild>
			<ButtonTw size={'md'} rounded={'lg'} variant="secondary">
				Open Dialog
			</ButtonTw>
		</DialogTrigger>
		<DialogContent>
			<DialogTitle>Hello dialog</DialogTitle>
			<DialogDescription>Some description</DialogDescription>
			<DialogClose>Close</DialogClose>
		</DialogContent>
	</Dialog>
);

export const Primary = {
	render: Template,
	args: {}
};
