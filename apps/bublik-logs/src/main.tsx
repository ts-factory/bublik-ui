/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

// eslint-disable-next-line @nx/enforce-module-boundaries
import '../../bublik/src/styles/fonts.css';
// eslint-disable-next-line @nx/enforce-module-boundaries
import '../../bublik/src/styles/tailwind.css';

import { App } from './app/app';
import { createLogViewerRouter } from './app/router';

// Created once, where the app mounts: a browser history patches
// `window.history` on creation.
const router = createLogViewerRouter();

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

root.render(
	<StrictMode>
		<App router={router} />
	</StrictMode>
);
