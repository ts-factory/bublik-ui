/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { TreeItem } from './tree-item';

const Story: Meta<typeof TreeItem> = {
	component: TreeItem,
	title: 'log/Tree Item',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {
		entity: 'test',
		label: 'app_rtt',
		isOpen: false,
		isFocused: false,
		isScrolled: false,
		isShowingRunLog: false,
		hasError: false,
		style: {},
		paddingStyle: {},
		path: 'sockapi-ts/app_rtt',
		isRoot: false
	}
};
