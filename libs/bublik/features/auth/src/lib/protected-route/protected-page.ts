/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * How many ProtectedRoutes are mounted. Kept outside React so code above the
 * route tree -- sign out in the sidebar -- can tell whether the open page
 * needs a session, without a data router (useMatches) or a provider.
 */
let openCount = 0;

/** Registers a mounted ProtectedRoute; returns its cleanup. */
function markProtectedPageOpen(): () => void {
	openCount += 1;

	return () => {
		openCount -= 1;
	};
}

function isProtectedPageOpen(): boolean {
	return openCount > 0;
}

export { markProtectedPageOpen, isProtectedPageOpen };
