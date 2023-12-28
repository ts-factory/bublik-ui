/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { Gutter } from './gutter';
import { DiffType } from '../run-diff/run-diff.types';

const Story: Meta<typeof Gutter> = {
	component: Gutter,
	title: 'diff/Gutter',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: { diffType: DiffType.ADDED }
};
