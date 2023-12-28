/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { Icon, SidebarContext } from '@/shared/tailwind-ui';

import { NavLink } from './nav-link';

const Story: Meta<typeof NavLink> = {
	component: NavLink,
	title: 'sidebar/Nav Link',
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/dashboard']}>
				<SidebarContext.Provider
					value={{
						isSidebarOpen: false,
						toggleSidebar: () => {
							//
						}
					}}
				>
					<div className="p-4 bg-white rounded resize w-[280px]">{Story()}</div>
				</SidebarContext.Provider>
			</MemoryRouter>
		)
	]
};
export default Story;

type Story = StoryObj<typeof NavLink>;
export const Primary: Story = {
	args: {
		to: '/dashboard',
		icon: <Icon name="PieChart" size={28} />,
		label: 'Dashboard',
		pattern: { path: '/dashboard' }
	}
};
