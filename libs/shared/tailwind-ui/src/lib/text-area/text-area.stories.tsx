/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';
import { withBackground } from '../storybook-bg';

import { TextArea } from './text-area';

const Story: Meta<typeof TextArea> = {
	component: TextArea,
	title: 'components/Text Area',
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {
		label: 'Label',
		name: 'name',
		placeholder: 'Placeholder'
	}
};
