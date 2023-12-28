/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { withBackground } from '@/shared/tailwind-ui';

import { ResultLinksContainer } from './result-links.container';

const Story: Meta<typeof ResultLinksContainer> = {
	component: ResultLinksContainer,
	title: 'run/Result Links',
	parameters: {
		layout: 'padded',
		reactRouter: {
			routePath: '/runs/:runId',
			routeParams: { runId: '15615614' }
		},
		msw: { handlers: [] }
	},
	decorators: [
		withBackground,
		(Story) => <MemoryRouter>{Story()}</MemoryRouter>
	]
};
export default Story;

export const Primary = {
	args: {
		runId: '1',
		resultId: 2,
		result: {}
	}
};
