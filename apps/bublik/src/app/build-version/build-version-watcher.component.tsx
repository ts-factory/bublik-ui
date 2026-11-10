/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useEffect, useRef } from 'react';
import {
	BlockerFunction,
	createPath,
	useBlocker,
	useLocation
} from 'react-router-dom';

import { config } from '@/bublik/config';

import {
	fetchDeployedBuildId,
	isNewBuild,
	openInNewBuild,
	reloadForNewBuild
} from './build-version';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MIN_CHECK_GAP_MS = 60 * 1000;

/**
 * Notices when a newer build has been deployed and moves the tab onto it on
 * the next navigation to another page: that navigation becomes a full page
 * load, which costs the user nothing they had on screen.
 */
function BuildVersionWatcher() {
	const { pathname } = useLocation();
	const newBuildIdRef = useRef<string | null>(null);
	const previousPathnameRef = useRef(pathname);

	useEffect(() => {
		// A dev server has no deployed build to compare with
		if (__BUILD_ID__ === 'dev') return;

		let lastCheckAt = 0;

		async function check() {
			if (newBuildIdRef.current) return;
			if (document.visibilityState !== 'visible') return;
			if (Date.now() - lastCheckAt < MIN_CHECK_GAP_MS) return;
			lastCheckAt = Date.now();

			const deployedBuildId = await fetchDeployedBuildId();
			if (isNewBuild(deployedBuildId)) newBuildIdRef.current = deployedBuildId;
		}

		const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
		document.addEventListener('visibilitychange', check);

		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener('visibilitychange', check);
		};
	}, []);

	// Take over the navigation before the old build renders the destination,
	// so that the page is loaded, and counted as viewed, once.
	const shouldBlock = useCallback<BlockerFunction>(
		({ currentLocation, nextLocation, historyAction }) => {
			const newBuildId = newBuildIdRef.current;

			if (!newBuildId) return false;
			if (currentLocation.pathname === nextLocation.pathname) return false;
			// The browser has already moved on back/forward: see the effect below
			if (historyAction === 'POP') return false;

			return openInNewBuild(
				newBuildId,
				`${config.baseUrl}${createPath(nextLocation)}`,
				{ replace: historyAction === 'REPLACE' }
			);
		},
		[]
	);
	useBlocker(shouldBlock);

	// Back/forward navigation cannot be taken over, so reload where it landed
	useEffect(() => {
		if (previousPathnameRef.current === pathname) return;
		previousPathnameRef.current = pathname;

		if (newBuildIdRef.current) reloadForNewBuild(newBuildIdRef.current);
	}, [pathname]);

	return null;
}

export { BuildVersionWatcher };
