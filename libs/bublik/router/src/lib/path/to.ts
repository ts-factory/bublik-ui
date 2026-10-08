/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/** The three parts of a `pathname?search#hash` string, each with its prefix. */
interface SplitTo {
	to: string;
	search: string;
	hash: string;
}

/**
 * Splits `/runs/1?page=2#top` into `{ to: '/runs/1', search: '?page=2',
 * hash: '#top' }`. Absent parts are `''`. A `?` after the `#` belongs to the
 * hash. Replaces React Router's `parsePath`.
 */
function splitTo(path: string): SplitTo {
	let rest = path;
	let hash = '';
	let search = '';

	const hashIndex = rest.indexOf('#');
	if (hashIndex >= 0) {
		hash = rest.slice(hashIndex);
		rest = rest.slice(0, hashIndex);
	}

	const searchIndex = rest.indexOf('?');
	if (searchIndex >= 0) {
		search = rest.slice(searchIndex);
		rest = rest.slice(0, searchIndex);
	}

	return { to: rest, search, hash };
}

/**
 * Joins the parts back, adding the `?` and `#` prefixes when they are missing
 * and dropping empty parts (a bare `?` or `#` counts as empty). An absent or
 * empty `to` is `/`. Replaces React Router's `createPath`.
 */
function joinTo({ to = '', search = '', hash = '' }: Partial<SplitTo>): string {
	let path = to || '/';

	if (search && search !== '?') {
		path += search.charAt(0) === '?' ? search : `?${search}`;
	}

	if (hash && hash !== '#') {
		path += hash.charAt(0) === '#' ? hash : `#${hash}`;
	}

	return path;
}

export { joinTo, splitTo };
export type { SplitTo };
