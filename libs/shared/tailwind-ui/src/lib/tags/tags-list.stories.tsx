/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { TagModel } from './tags-list.types';
import { TagsList } from '.';
import { Badge } from '../badge';
import { useTagListState } from './tags-list.hooks';

const EXAMPLE_TAGS: TagModel[] = [
	{ id: 'Test_1', label: 'Test 1', value: 'Test_1' },
	{ id: 'Test_2', label: 'Test 2', value: 'Test_2' },
	{ id: 'Test_3', label: 'Test 3', value: 'Test_3' },
	{ id: 'Test_4', label: 'Test 4', value: 'Test_4' }
];

export default {
	component: TagsList.Root,
	title: 'components/Tags List',
	decorators: [withBackground]
} satisfies Meta<typeof TagsList.Root>;

export const Primary = () => {
	const state = useTagListState({ tags: EXAMPLE_TAGS });

	return (
		<TagsList.Root state={state}>
			<TagsList.TagInput />
			<TagsList.List className="flex items-center gap-4">
				{state.tags.map((tag) => (
					<TagsList.ListItem asChild key={tag.value} tag={tag}>
						<Badge>{tag.label}</Badge>
					</TagsList.ListItem>
				))}
			</TagsList.List>
		</TagsList.Root>
	);
};
