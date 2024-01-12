/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { NotFound } from './not-found';
import { MemoryRouter } from 'react-router-dom';

export default {
	component: NotFound,
	title: 'components/Not Found',
	decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>],
	parameters: { layout: 'fullscreen' }
} as Meta<typeof NotFound>;

export const Primary = {
	args: {}
};
