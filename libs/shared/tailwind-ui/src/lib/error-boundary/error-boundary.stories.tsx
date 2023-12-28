/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { ResetState } from './error-boundary';

export default {
	component: ResetState,
	title: 'Bublik UI/Error Boundary',
	parameters: { layout: 'fullscreen' }
} as Meta<typeof ResetState>;

export const Primary = {
	args: {}
};
