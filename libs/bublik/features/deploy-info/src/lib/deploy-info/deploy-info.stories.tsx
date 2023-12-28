/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable @nx/enforce-module-boundaries */
import { Meta } from '@storybook/react';
import {
	DeployInfo,
	DeployInfoEmpty,
	DeployInfoError,
	DeployInfoLoading,
	DeployInfoContainer
} from '.';
import { TooltipProvider, withBackground } from '@/shared/tailwind-ui';

export default {
	component: DeployInfo,
	title: 'help/Deploy Info',
	decorators: [
		withBackground,
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		)
	]
} as Meta<typeof DeployInfo>;

export const Primary = {
	args: {
		projectName: 'Test',
		frontend: {
			branch: 'main',
			date: '2022-09-01',
			revision: 'b87ecdf',
			summary: 'Commit from GitHub Actions (Create release build)',
			latestTag: 'v1.0.0'
		},
		backend: {
			branch: 'dev',
			date: '2022-09-19',
			revision: 'a1c6539',
			summary: 'xml parser',
			latestTag: 'v0.1.2'
		}
	}
};

export const Loading = () => <DeployInfoLoading />;
export const Error = () => <DeployInfoError error={{ status: 404 }} />;
export const Empty = () => <DeployInfoEmpty />;
export const Container = () => <DeployInfoContainer />;
