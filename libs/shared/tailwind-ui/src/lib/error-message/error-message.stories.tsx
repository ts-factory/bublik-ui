/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { ErrorMessage, ErrorMessageProps } from './error-message';

export default {
	component: ErrorMessage,
	title: 'form/Error Message',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta;

const Template: StoryFn<ErrorMessageProps> = (args) => (
	<ErrorMessage>Test Label</ErrorMessage>
);

export const Primary = {
	render: Template,
	args: {}
};
