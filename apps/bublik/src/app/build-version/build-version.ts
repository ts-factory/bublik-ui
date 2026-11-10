/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { z } from 'zod';

import { config } from '@/bublik/config';

const VersionFileSchema = z.object({ buildId: z.string().min(1) });

/** Holds the last full page load this tab made to reach a deployed build */
const RELOAD_STORAGE_KEY = 'bublik:build-reload';

/** The shortest time between two such loads, whatever the server reports */
const MIN_LOAD_GAP_MS = 60 * 1000;

const LoadClaimSchema = z.object({ buildId: z.string(), at: z.number() });

/**
 * Reads the id of the build the server currently serves from `version.json`,
 * which the build writes next to `index.html`.
 *
 * Returns `null` whenever the id cannot be told: the request failed, the file
 * is missing, or the server answered with something else (an SPA fallback
 * returns `index.html` for unknown paths).
 */
async function fetchDeployedBuildId(): Promise<string | null> {
	try {
		// The query and `no-store` get past servers that cache `*.json` for long
		const response = await fetch(
			`${config.baseUrl}/version.json?t=${Date.now()}`,
			{ cache: 'no-store' }
		);
		if (!response.ok) return null;

		const parsed = VersionFileSchema.safeParse(await response.json());

		return parsed.success ? parsed.data.buildId : null;
	} catch {
		return null;
	}
}

/** Tells whether `deployedBuildId` is a build other than the running one. */
function isNewBuild(
	deployedBuildId: string | null,
	currentBuildId: string = __BUILD_ID__
): deployedBuildId is string {
	if (currentBuildId === 'dev') return false;

	return deployedBuildId !== null && deployedBuildId !== currentBuildId;
}

/**
 * Takes the one full page load this tab may spend on moving to
 * `deployedBuildId`, and tells whether it was still available.
 *
 * Two cases are refused, because more loads would not help and would only
 * loop:
 * - the tab has already loaded for this build and still runs the old one (the
 *   server keeps handing out a stale `index.html`);
 * - the tab made such a load less than a minute ago (servers that report
 *   different builds in turn, as in the middle of a rolling update).
 *
 * Without session storage a loop cannot be told, so nothing is granted.
 */
function claimLoadForBuild(deployedBuildId: string): boolean {
	try {
		const storage = window.sessionStorage;
		const now = Date.now();
		const last = readLoadClaim(storage.getItem(RELOAD_STORAGE_KEY));

		if (last?.buildId === deployedBuildId) return false;
		if (last && now - last.at < MIN_LOAD_GAP_MS) return false;

		storage.setItem(
			RELOAD_STORAGE_KEY,
			JSON.stringify({ buildId: deployedBuildId, at: now })
		);
		return true;
	} catch {
		return false;
	}
}

function readLoadClaim(
	raw: string | null
): z.infer<typeof LoadClaimSchema> | null {
	if (raw === null) return null;

	const parsed = LoadClaimSchema.safeParse(JSON.parse(raw));
	// An unreadable record throws above or lands here: either way no load
	if (!parsed.success) throw new Error('Unreadable load record');

	return parsed.data;
}

/**
 * Reloads the page after a chunk could not be loaded, provided the server
 * confirms that a newer build replaced the files this tab was started from.
 *
 * In every other case a reload would not bring the chunk back (the network is
 * down, or the file is missing from the current build), so the error is left
 * to the error boundary and the page keeps its state.
 */
async function reloadAfterChunkError(
	currentBuildId: string = __BUILD_ID__
): Promise<boolean> {
	const deployedBuildId = await fetchDeployedBuildId();

	if (!isNewBuild(deployedBuildId, currentBuildId)) return false;
	if (!claimLoadForBuild(deployedBuildId)) return false;

	window.location.reload();
	return true;
}

/**
 * Moves this tab onto `deployedBuildId` by reloading the current page.
 * Returns `false` when the tab has already spent its load for that build.
 */
function reloadForNewBuild(deployedBuildId: string): boolean {
	if (!claimLoadForBuild(deployedBuildId)) return false;

	window.location.reload();
	return true;
}

/**
 * Moves this tab onto `deployedBuildId` by opening `href` with a full page
 * load, in place of the in-app navigation that was heading there.
 * Returns `false` when the tab has already spent its load for that build.
 */
function openInNewBuild(
	deployedBuildId: string,
	href: string,
	options: { replace: boolean }
): boolean {
	if (!claimLoadForBuild(deployedBuildId)) return false;

	if (options.replace) window.location.replace(href);
	else window.location.assign(href);
	return true;
}

/** Vite dispatches `vite:preloadError` when a dynamic import fails to load. */
function installChunkErrorReload(): void {
	window.addEventListener('vite:preloadError', () => {
		void reloadAfterChunkError();
	});
}

export {
	claimLoadForBuild,
	fetchDeployedBuildId,
	installChunkErrorReload,
	isNewBuild,
	MIN_LOAD_GAP_MS,
	openInNewBuild,
	reloadAfterChunkError,
	reloadForNewBuild,
	RELOAD_STORAGE_KEY
};
