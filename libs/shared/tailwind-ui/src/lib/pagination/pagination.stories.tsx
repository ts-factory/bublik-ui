/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { Pagination, PaginationProps } from './pagination';

export default {
	component: Pagination,
	title: 'components/Pagination'
} as Meta;

export const Primary = {
	args: {
		totalCount: 3000,
		pageSize: 25,
		currentPage: 1
	}
};
