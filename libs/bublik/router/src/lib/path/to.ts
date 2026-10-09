/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { parseSearch, type Wire } from '../search/wire';

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

/** React Router's `Path`: each part carries its own prefix. */
interface Path {
	pathname: string;
	search: string;
	hash: string;
}

/**
 * A link or navigation target as the app's call sites still write it:
 * a `pathname?search#hash` string or a partial `Path` (React Router's `To`).
 * The `routes.*` builders produce the object form.
 */
type To = string | Partial<Path>;

/** A `To` in the shape the TanStack router takes. */
interface ResolvedTo {
	/** The pathname, basepath-free and verbatim (no route template is interpolated). */
	to: string;
	/** The query string parsed to wire values; the route middlewares serialize it back. */
	search: Wire;
	/** The fragment without its `#`, or `undefined` for none (the router then writes none). */
	hash: string | undefined;
}

/** The parts of a `To`, each with its prefix, absent ones `''`. */
function splitTarget(to: To): SplitTo {
	return typeof to === 'string'
		? splitTo(to)
		: { to: to.pathname ?? '', search: to.search ?? '', hash: to.hash ?? '' };
}

/**
 * Resolves a `To` the way React Router's `useNavigate`/`<Link>` did: a
 * missing or empty pathname means the current one (so `{ search }` rewrites
 * the query string in place), and a missing hash drops the current fragment.
 */
function resolveTo(to: To, currentPathname: string): ResolvedTo {
	const parts = splitTarget(to);
	const hash = parts.hash.replace(/^#/, '');

	return {
		to: parts.to || currentPathname,
		search: parseSearch(parts.search),
		hash: hash || undefined
	};
}

export { joinTo, resolveTo, splitTarget, splitTo };
export type { Path, ResolvedTo, SplitTo, To };
