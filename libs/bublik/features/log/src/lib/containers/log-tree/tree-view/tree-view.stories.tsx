/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';
import { TreeView } from './tree-view';
import { props } from './tree-view.mock';

import { LogPageMode } from '@/shared/types';

const Story: Meta<typeof TreeView> = {
	component: TreeView,
	title: 'log/Tree',
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/log/:runId',
			routeParams: { runId: '841' },
			searchParams: { mode: LogPageMode.TreeAndInfoAndLog }
		}
	},
	decorators: [
		withRouter,
		(Story) => (
			<div className="w-[400px] h-screen bg-white roundeed">{Story()}</div>
		)
	]
};
export default Story;

type Story = StoryObj<typeof TreeView>;
export const Primary: Story = {
	args: props
};
