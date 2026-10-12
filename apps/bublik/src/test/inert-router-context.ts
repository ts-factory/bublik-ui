/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { RouterContext } from '../routes/-loaders';

/**
 * A router context whose store takes the loaders' prefetches and sends
 * nothing, for specs about routing (URLs, matches, redirects) that should
 * not reach the network. `-loaders.spec.ts` uses a real store instead.
 */
const inertRouterContext: RouterContext = {
	store: {
		dispatch: (() =>
			Promise.resolve()) as unknown as RouterContext['store']['dispatch']
	}
};

export { inertRouterContext };
