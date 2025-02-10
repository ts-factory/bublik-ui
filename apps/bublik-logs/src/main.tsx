import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

// eslint-disable-next-line @nx/enforce-module-boundaries
import '../../bublik/src/styles/fonts.css';
// eslint-disable-next-line @nx/enforce-module-boundaries
import '../../bublik/src/styles/tailwind.css';

import { App } from './app/app';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

root.render(
	<StrictMode>
		<App />
	</StrictMode>
);
