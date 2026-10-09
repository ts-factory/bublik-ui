/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * Which location to read and which to write on, for code that runs while a
 * navigation may be in flight. The projects wrappers, the
 * sidebar writers, sidebar-nav, settings and `useSearchWriter` go through
 * these, so reads and writes agree.
 */
import { useCallback } from 'react';
import {
	useRouter,
	useRouterState,
	type AnyRouter,
	type ParsedLocation
} from '@tanstack/react-router';

/** React Router's `Location`: `search` carries its `?`, `hash` its `#`. */
interface Location<State = unknown> {
	pathname: string;
	search: string;
	hash: string;
	state: State;
	key: string;
}

/**
 * Where the router is right now, counting a navigation committed earlier in
 * this tick: several writes in one handler each build on the previous one
 * and coalesce into one history entry, as the functional search updater does.
 * `_pendingLocation` is router-core's own fallback in `buildLocation`; it is
 * not public API, so the `useLatestLocation` and coalescing specs pin it.
 */
function currentLocation(router: AnyRouter): ParsedLocation {
	return router._pendingLocation ?? router.latestLocation;
}

/** Path equality as the router matches: case-insensitive, trailing slash ignored. */
function samePath(a: string, b: string): boolean {
	const normalize = (path: string) =>
		(path.length > 1 ? path.replace(/\/+$/, '') : path).toLowerCase();

	return normalize(a) === normalize(b);
}

/**
 * The location the rendered matches belong to. React Router's `useLocation`
 * changed together with the rendered route; TanStack's `useLocation` moves
 * as soon as a navigation starts, while the previous page is still mounted
 * (its chunk or loader may be pending), so a page would see the next page's
 * address. `resolvedLocation` alone is not it either: router-core renders the
 * new matches first and resolves the location after that render, so a page
 * mounted by a navigation would see the previous page's location (and miss
 * its `location.state`) on its first render. The latest location is the
 * rendered one exactly when the leaf match on screen is at its pathname.
 * Every read of "the page on screen" goes through this; writes use
 * `currentLocation`.
 */
function useRenderedLocation(): ParsedLocation {
	return useRouterState<AnyRouter, ParsedLocation>({
		select: (state) => {
			const leaf = state.matches[state.matches.length - 1];

			if (!state.resolvedLocation || !leaf) return state.location;

			return samePath(leaf.pathname, state.location.pathname)
				? state.location
				: state.resolvedLocation;
		}
	});
}

/** A TanStack location in React Router's shape. */
function toRouterLocation<State = unknown>(
	location: ParsedLocation
): Location<State> {
	return {
		pathname: location.pathname,
		search: location.searchStr,
		hash: location.hash ? `#${location.hash}` : '',
		state: location.state as State,
		key: location.state.__TSR_key ?? 'default'
	};
}

/**
 * A getter for the location the router is at right now, in React Router's
 * shape, counting a navigation committed earlier in this tick or still
 * loading. A write must build every part of its target on this one
 * location:
 *
 * - `window.location` lags a microtask behind (the TanStack history applies
 *   `replaceState` late), so a writer reading it after another write puts
 *   the old URL back and loops;
 * - the rendered location is the page on screen, so while the next page's
 *   chunk loads, a write that mixes its pathname with the pending query
 *   string lands on the old page and hijacks the navigation the user started.
 */
function useLatestLocation(): () => Location {
	const router = useRouter<AnyRouter>();

	return useCallback(() => toRouterLocation(currentLocation(router)), [router]);
}

export {
	currentLocation,
	samePath,
	toRouterLocation,
	useLatestLocation,
	useRenderedLocation
};
export type { Location };
