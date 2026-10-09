/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';

import { useRenderedLocation } from '@/router';

/**
 * When Bublik runs inside a cross-origin iframe (e.g. embedded in other webapp),
 * the parent frame cannot read URL due to Same-Origin Policy.
 * This component fires a `postMessage` to the parent on every route change
 * so the parent can track the currently focused test without any DOM hacks.
 *
 * Message format:
 * { "type": "bublik:navigation", "path": "/log/1", "search": "?focusId=336&mode=...", "focusId": 336 }
 * `focusId` is `null` when the run-level log (no specific test) is shown.
 * `path` is relative to the base URL, as it was under React Router.
 */
function IframeNavigationReporter() {
	// The page on screen; `searchStr` carries its `?`, as `location.search` did
	const { pathname, searchStr } = useRenderedLocation();

	useEffect(() => {
		// Skip when not embedded — avoids unnecessary postMessage noise.
		if (window.parent === window) return;

		const params = new URLSearchParams(searchStr);
		const raw = params.get('focusId');
		const parsed = raw !== null ? parseInt(raw, 10) : null;
		const focusId = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

		window.parent.postMessage(
			{
				type: 'bublik:navigation',
				path: pathname,
				search: searchStr,
				focusId
			},
			'*'
		);
	}, [pathname, searchStr]);

	return null;
}

export { IframeNavigationReporter };
