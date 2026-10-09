/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { RouterProvider } from '@tanstack/react-router';
import { Provider } from 'react-redux';

import { TooltipProvider } from '@/shared/tailwind-ui';

import type { LogViewerRouter } from './router';
import { store } from './store';

interface AppProps {
	router: LogViewerRouter;
}

function App({ router }: AppProps) {
	return (
		<Provider store={store}>
			<TooltipProvider>
				<RouterProvider router={router} />
			</TooltipProvider>
		</Provider>
	);
}

export { App };
