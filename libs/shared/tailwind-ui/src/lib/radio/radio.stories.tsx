/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { Radio, RadioProps } from './radio';

export default {
	component: Radio,
	title: 'form/Radio',
	decorators: [withBackground]
} as Meta;

export const Primary = {
	args: {
		label: 'Test label',
		checked: false
	}
};
