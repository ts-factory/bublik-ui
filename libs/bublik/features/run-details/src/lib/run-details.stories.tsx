/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import {
	RunDetails,
	RunDetailsEmpty,
	RunDetailsError,
	RunDetailsLoading
} from './run-details.component';
import { RUN_STATUS } from '@/shared/types';
import { withBackground } from '@/shared/tailwind-ui';

export default {
	component: RunDetails,
	title: 'run/Run Details',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
} as Meta;

export const Primary = {
	args: {
		isFullMode: false,
		runStatus: RUN_STATUS.Ok,
		status: 'ok',
		statusByNok: 'ok'
	}
};

export const Loading = () => <RunDetailsLoading />;
export const Error = () => <RunDetailsError error={{ status: 400 }} />;
export const Empty = () => <RunDetailsEmpty />;
