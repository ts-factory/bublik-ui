/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { DiffForm } from './diff-form.component';

const Story: Meta<typeof DiffForm> = {
	component: DiffForm,
	title: 'diff/Diff Form',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {
		defaultOpen: true,
		defaultValues: { leftRunId: 1, rightRunId: 2 }
	}
};
