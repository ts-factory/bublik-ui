/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { notFound } from '@tanstack/react-router';

/** A database id in a path: digits only, so `-1`, `1.5` and `1e3` are not ids. */
const ID = /^\d+$/;

/**
 * Whether a path segment is an id, for code that matches a pathname outside
 * its route (the sidebars, through `matchRoutePath`): the rule the routes'
 * `params.parse` applies.
 */
function isIdSegment(raw: string): boolean {
	return ID.test(raw);
}

/** The id a path segment holds; throws `notFound()` for anything else. */
function parseId(raw: string): number {
	if (!isIdSegment(raw)) throw notFound();

	return Number(raw);
}

/** A route's `params` option for the ids among its path params. */
interface IdParams<Key extends string> {
	parse: (raw: Record<Key, string>) => Record<Key, number>;
	stringify: (params: Record<Key, number>) => Record<Key, string>;
}

/**
 * `params` of a route whose path holds database ids (`$runId`, `$resultId`,
 * `$issueId`): the page reads them as numbers, links pass numbers, and an id
 * that is not a number throws `notFound()`. The route's own
 * `notFoundComponent` then renders in its parent's outlet, inside the layout,
 * at the address as typed, instead of the page's empty state.
 * A leading zero is read away (`/runs/007` is run 7) and kept on the address;
 * only a navigation that re-interpolates the route's path writes `7`.
 */
function idParams<const Key extends string>(...keys: Key[]): IdParams<Key> {
	return {
		parse: (raw: Record<Key, string>): Record<Key, number> => {
			const params = {} as Record<Key, number>;
			for (const key of keys) params[key] = parseId(raw[key]);

			return params;
		},
		stringify: (params: Record<Key, number>): Record<Key, string> => {
			const raw = {} as Record<Key, string>;
			for (const key of keys) raw[key] = String(params[key]);

			return raw;
		}
	};
}

export { idParams, isIdSegment, parseId };
export type { IdParams };
