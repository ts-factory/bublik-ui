/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, Spinner } from '@/shared/tailwind-ui';

import { printDevInfoToConsole } from './dev-console';
import { App } from './app/app';

printDevInfoToConsole();

const container = document.getElementById('root');

if (!container) throw new Error('Mount node not found!');

const root = createRoot(container);

root.render(
	<StrictMode>
		<ErrorBoundary>
			<Suspense fallback={<Spinner className="h-screen" />}>
				<App />
			</Suspense>
		</ErrorBoundary>
	</StrictMode>
);
