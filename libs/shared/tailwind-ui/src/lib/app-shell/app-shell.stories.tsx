/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { AppShell } from './app-shell';

export default {
	component: AppShell,
	title: 'components/App Shell',
	parameters: { layout: 'fullscreen' }
} as Meta<typeof AppShell>;

const Template: StoryFn<typeof AppShell> = (args) => (
	<AppShell
		sidebar={
			<div className="w-[52px] bg-white h-screen flex flex-col items-center justify-center">
				<span
					style={{ textOrientation: 'upright', writingMode: 'vertical-rl' }}
				>
					Sidebar
				</span>
			</div>
		}
	>
		<div className="grid h-screen p-1 place-items-center">
			<h1>Main content</h1>
		</div>
	</AppShell>
);

export const Primary = {
	render: Template,
	args: {}
};
