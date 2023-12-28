/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { SearchBar } from './search-bar.component';

const meta: Meta<typeof SearchBar> = {
	component: SearchBar,
	title: 'dashboard/Search',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof SearchBar>;

const Template: StoryFn<typeof SearchBar> = (args) => {
	const [term, setTerm] = useState('');

	return <SearchBar searchTerm={term} onSearchTermChange={setTerm} {...args} />;
};

export const Primary = {
	render: Template,
	args: {}
} satisfies Story;
