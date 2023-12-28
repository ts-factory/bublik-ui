/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from './collapsible';
import { withBackground } from '../storybook-bg';

export default {
	component: Collapsible,
	title: 'components/Collapsible',
	decorators: [withBackground]
} satisfies Meta<typeof Collapsible>;

export const Primary = () => {
	return (
		<Collapsible>
			<CollapsibleTrigger>Open</CollapsibleTrigger>
			<CollapsibleContent>Content</CollapsibleContent>
		</Collapsible>
	);
};
