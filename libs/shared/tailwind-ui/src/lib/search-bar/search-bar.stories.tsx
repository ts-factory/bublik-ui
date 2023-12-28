/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { SearchBar } from './search-bar';

export default {
	component: SearchBar,
	title: 'components/Search Bar',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof SearchBar>;

export const Primary = {
	args: {
		placeholder: 'Placeholder...'
	}
};
