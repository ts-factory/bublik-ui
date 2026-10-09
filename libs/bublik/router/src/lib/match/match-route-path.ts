/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { matchPath } from './path-pattern';

/** A route path to test a pathname against. */
interface RoutePathPattern {
	/** A route path as the route tree spells it: `/runs/$runId`. */
	to: string;
	/** Also match below it, at a segment boundary: `/help` matches `/help/faq`. */
	fuzzy?: boolean;
}

/** `$param` → `:param`, `{-$param}` → `:param?`, a `$` splat → `*`. */
function toPathPattern(to: string): string {
	return to
		.split('/')
		.map((segment) => {
			if (segment === '$') return '*';

			const optional = /^\{-\$([\w-]+)\}$/.exec(segment);
			if (optional) return `:${optional[1]}?`;

			return segment.startsWith('$') ? `:${segment.slice(1)}` : segment;
		})
		.join('/');
}

/**
 * Whether `pathname` (basepath-free) is at the route path `to`, and its
 * params if so: case-insensitive, a trailing slash tolerated, exact unless
 * `fuzzy`. Matches as React Router's `matchPath` did, so sidebar highlighting
 * and the analytics paths stay as they were.
 *
 * Pure on purpose, rather than `router.matchRoute`: that one only tests the
 * router's own location, and picks the resolved or the pending one by the
 * router's status, so for a render it disagrees with the page on screen;
 * and the analytics tracker matches `window.location` outside
 * React. Callers pass `useRenderedLocation().pathname`.
 */
function matchRoutePath(
	{ to, fuzzy = false }: RoutePathPattern,
	pathname: string
): Record<string, string> | false {
	const match = matchPath({ path: toPathPattern(to), end: !fuzzy }, pathname);

	if (!match) return false;

	return Object.fromEntries(
		Object.entries(match.params).filter(
			(entry): entry is [string, string] => entry[1] !== undefined
		)
	);
}

export { matchRoutePath };
export type { RoutePathPattern };
