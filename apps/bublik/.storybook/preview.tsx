/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Provider } from 'react-redux';
import { Preview } from '@storybook/react';
import { initialize, mswDecorator } from 'msw-storybook-addon';

import { Providers } from '@/shared/tailwind-ui';
import { store } from '@/bublik/+state';

import '../src/styles/fonts.css';
import '../src/styles/tailwind.css';

initialize({ quiet: true, onUnhandledRequest: 'bypass' });

const preview: Preview = {
    parameters: {
		layout: 'centered',
		backgrounds: {
			default: 'light',
			values: [
				{ name: 'light', value: '#f5f5f5' },
				{ name: 'dark', value: '#3b5998' }
			]
		}
	},

    decorators: [
		(Story) => (
			<Provider store={store}>
				<Providers>
					<div className="antialiased font-medium selection:text-white selection:bg-primary text-text-primary bg-bg-body">
						<Story />
					</div>
				</Providers>
			</Provider>
		),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mswDecorator as any
	],

    tags: ['autodocs']
};

export default preview;
