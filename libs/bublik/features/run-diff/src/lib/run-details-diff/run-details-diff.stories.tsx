/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';

import {
	RunDetailsDiff,
	RunDetailsDiffError,
	RunDetailsDiffLoading
} from './run-details-diff';
import { withBackground } from '@/shared/tailwind-ui';

const Story: Meta<typeof RunDetailsDiff> = {
	component: RunDetailsDiff,
	title: 'diff/RunDetails Diff',
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {}
};

export const Loading = () => <RunDetailsDiffLoading />;
export const Error = () => <RunDetailsDiffError error={{ status: 404 }} />;
