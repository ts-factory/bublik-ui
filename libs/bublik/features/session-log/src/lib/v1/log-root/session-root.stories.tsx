/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { withBackground } from '@/shared/tailwind-ui';
import type { Meta, StoryObj } from '@storybook/react';

import { SessionRoot } from './session-root';

const Story: Meta<typeof SessionRoot> = {
	component: SessionRoot,
	title: 'log/Log Content',
	decorators: [withBackground],
	parameters: { layout: 'padded' }
};
export default Story;

type Story = StoryObj<typeof SessionRoot>;

export const Primary = {
	args: { root: { root: [], version: 'v1' } }
} satisfies Story;
