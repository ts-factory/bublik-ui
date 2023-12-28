/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { Input, InputProps } from './input';

export default {
	component: Input,
	title: 'form/Input',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta;

export const Primary = {
	args: {
		placeholder: 'Placeholder',
		label: 'Label',
		disabled: false
	}
};

export const WithError = {
	args: {
		placeholder: 'Placeholder',
		label: 'With Error',
		disabled: false,
		error: 'Somethin went wrong'
	}
};

export const Disabled = {
	args: {
		placeholder: 'Placeholder',
		label: 'Disabled styles',
		disabled: true
	}
};
