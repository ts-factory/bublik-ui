/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	claimLoadForBuild,
	fetchDeployedBuildId,
	isNewBuild,
	MIN_LOAD_GAP_MS,
	openInNewBuild,
	reloadAfterChunkError,
	reloadForNewBuild,
	RELOAD_STORAGE_KEY
} from './build-version';

const reload = vi.fn();
const assign = vi.fn();
const replace = vi.fn();

function stubFetch(response: Response | Error) {
	const fetchMock = vi.fn(() =>
		response instanceof Error
			? Promise.reject(response)
			: Promise.resolve(response.clone())
	);
	vi.stubGlobal('fetch', fetchMock);

	return fetchMock;
}

beforeEach(() => {
	window.sessionStorage.clear();
	vi.clearAllMocks();
	vi.stubGlobal('location', { ...window.location, reload, assign, replace });
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('fetchDeployedBuildId', () => {
	it('returns the id from version.json, bypassing the cache', async () => {
		const fetchMock = stubFetch(Response.json({ buildId: 'build-b' }));

		expect(await fetchDeployedBuildId()).toBe('build-b');
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/version\.json\?t=\d+$/),
			{ cache: 'no-store' }
		);
	});

	it('returns null when the server answers with index.html', async () => {
		stubFetch(
			new Response('<!doctype html><html></html>', {
				headers: { 'Content-Type': 'text/html' }
			})
		);

		expect(await fetchDeployedBuildId()).toBeNull();
	});

	it('returns null when the file is missing', async () => {
		stubFetch(new Response('Not found', { status: 404 }));

		expect(await fetchDeployedBuildId()).toBeNull();
	});

	it('returns null for an unexpected shape', async () => {
		stubFetch(Response.json({ version: '1.0.0' }));

		expect(await fetchDeployedBuildId()).toBeNull();
	});

	it('returns null when the request fails', async () => {
		stubFetch(new TypeError('Failed to fetch'));

		expect(await fetchDeployedBuildId()).toBeNull();
	});
});

describe('isNewBuild', () => {
	it('is true for a different deployed build', () => {
		expect(isNewBuild('build-b', 'build-a')).toBe(true);
	});

	it('is false for the running build', () => {
		expect(isNewBuild('build-a', 'build-a')).toBe(false);
	});

	it('is false when the deployed build is unknown', () => {
		expect(isNewBuild(null, 'build-a')).toBe(false);
	});

	it('is false in development', () => {
		expect(isNewBuild('build-b', 'dev')).toBe(false);
	});
});

describe('claimLoadForBuild', () => {
	it('grants one load per deployed build', () => {
		vi.useFakeTimers();

		expect(claimLoadForBuild('build-b')).toBe(true);
		expect(claimLoadForBuild('build-b')).toBe(false);

		vi.advanceTimersByTime(MIN_LOAD_GAP_MS);
		expect(claimLoadForBuild('build-b')).toBe(false);
		expect(claimLoadForBuild('build-c')).toBe(true);
	});

	it('grants no second load within a minute, whatever the build', () => {
		vi.useFakeTimers();

		// Servers that report build-b and build-c in turn
		expect(claimLoadForBuild('build-b')).toBe(true);
		expect(claimLoadForBuild('build-c')).toBe(false);
		expect(claimLoadForBuild('build-b')).toBe(false);

		vi.advanceTimersByTime(MIN_LOAD_GAP_MS - 1);
		expect(claimLoadForBuild('build-c')).toBe(false);

		vi.advanceTimersByTime(1);
		expect(claimLoadForBuild('build-c')).toBe(true);
	});

	it('grants nothing when the stored record cannot be read', () => {
		window.sessionStorage.setItem(RELOAD_STORAGE_KEY, 'build-b');

		expect(claimLoadForBuild('build-c')).toBe(false);
	});

	it('grants nothing without session storage', () => {
		vi.stubGlobal('sessionStorage', {
			getItem: () => {
				throw new Error('blocked');
			}
		});

		expect(claimLoadForBuild('build-b')).toBe(false);
	});
});

describe('reloadAfterChunkError', () => {
	it('reloads when a newer build is deployed', async () => {
		stubFetch(Response.json({ buildId: 'build-b' }));

		expect(await reloadAfterChunkError('build-a')).toBe(true);
		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('reloads once when the reload did not bring the new build', async () => {
		stubFetch(Response.json({ buildId: 'build-b' }));
		await reloadAfterChunkError('build-a');

		expect(await reloadAfterChunkError('build-a')).toBe(false);
		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('does not reload when the chunk is missing from the current build', async () => {
		stubFetch(Response.json({ buildId: 'build-a' }));

		expect(await reloadAfterChunkError('build-a')).toBe(false);
		expect(reload).not.toHaveBeenCalled();
	});

	it('does not reload when the network is down', async () => {
		stubFetch(new TypeError('Failed to fetch'));

		expect(await reloadAfterChunkError('build-a')).toBe(false);
		expect(reload).not.toHaveBeenCalled();
	});
});

describe('reloadForNewBuild', () => {
	it('reloads once per deployed build', () => {
		expect(reloadForNewBuild('build-b')).toBe(true);
		expect(reloadForNewBuild('build-b')).toBe(false);
		expect(reload).toHaveBeenCalledTimes(1);
	});
});

describe('openInNewBuild', () => {
	it('opens the destination with a full page load', () => {
		expect(openInNewBuild('build-b', '/v2/runs', { replace: false })).toBe(
			true
		);
		expect(assign).toHaveBeenCalledWith('/v2/runs');
	});

	it('replaces the history entry for a replacing navigation', () => {
		openInNewBuild('build-b', '/v2/runs', { replace: true });

		expect(replace).toHaveBeenCalledWith('/v2/runs');
		expect(assign).not.toHaveBeenCalled();
	});

	it('leaves the navigation alone once the load for the build is spent', () => {
		openInNewBuild('build-b', '/v2/runs', { replace: false });

		expect(openInNewBuild('build-b', '/v2/history', { replace: false })).toBe(
			false
		);
		expect(assign).toHaveBeenCalledTimes(1);
	});
});
