/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { LogPageMode } from '@/shared/types';

import { LogPage } from './log-page';

const handlers = [];

export default {
	component: LogPage,
	title: 'Bublik UI/Log Page',
	decorators: [withRouter],
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/log/:runId',
			routeParams: { runId: '42' },
			searchParams: { mode: LogPageMode.TreeAndInfoAndLog }
		},
		msw: { handlers },
		docs: {
			source: {
				code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554'
			}
		}
	}
} as Meta<typeof LogPage>;

export const Primary = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: LogPageMode.TreeAndInfoAndLog } }
	}
};

export const TreeAndLog = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: LogPageMode.TreeAndLog } }
	}
};

export const InfoAndLog = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: LogPageMode.InfoAndLog } }
	}
};

export const JustLog = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: LogPageMode.Log } }
	}
};
