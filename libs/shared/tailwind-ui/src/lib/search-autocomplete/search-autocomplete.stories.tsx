/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '../storybook-bg';

import { Item, SearchAutocomplete, Section } from './search-autocomplete';

export default {
	component: SearchAutocomplete,
	title: 'components/Search Autocomplete',
	decorators: [withBackground]
} as Meta<typeof SearchAutocomplete>;

const Template: StoryFn<typeof SearchAutocomplete> = (args) => {
	const options = [
		{
			name: 'Suggestions',
			children: [
				{ id: 1, name: 'V5=master' },
				{ id: 2, name: 'TS_SET=ip4_testing8' },
				{ id: 3, name: 'TR=TEST' },
				{ id: 4, name: 'TR=!O_ASYNC' },
				{ id: 5, name: 'ool_epoll=2' },
				{ id: 6, name: 'ul-64' },
				{ id: 7, name: 'urg_allow' },
				{ id: 8, name: 'default_iomux_epoll' },
				{ id: 9, name: 'medford' },
				{ id: 10, name: 'testford' },
				{ id: 11, name: 'bedford' },
				{ id: 12, name: 'testing_set' }
			]
		}
	];

	return (
		<SearchAutocomplete
			label="Tags & Metadata"
			defaultItems={options}
			allowsCustomValue
		>
			{(item) => (
				<Section key={item.name} items={item.children} title={item.name}>
					{(item) => <Item>{item.name}</Item>}
				</Section>
			)}
		</SearchAutocomplete>
	);
};

export const Primary = {
	render: Template,
	args: {}
};
