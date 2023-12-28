/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Provider } from 'react-redux';

import { store } from '@/bublik/+state';
import { Providers } from '@/shared/tailwind-ui';

import { Router } from './router';

import '../styles/tailwind.css';
import '../styles/fonts.css';

export const App = () => {
	return (
		<Provider store={store}>
			<Providers>
				<Router />
			</Providers>
		</Provider>
	);
};
