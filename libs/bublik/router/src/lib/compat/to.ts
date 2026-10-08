/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { splitTo } from '../path/to';
import { parseSearch, type Wire } from '../search/wire';

/** React Router's `Path`: each part carries its own prefix. */
interface Path {
	pathname: string;
	search: string;
	hash: string;
}

/** React Router's `To`: a `pathname?search#hash` string or a partial `Path`. */
type To = string | Partial<Path>;

/**
 * React Router's `parsePath`: the parts of a `To` string, each only present
 * when non-empty (`parsePath('/x').search` is `undefined`).
 */
function parsePath(path: string): Partial<Path> {
	const { to, search, hash } = splitTo(path);
	const parsed: Partial<Path> = {};

	if (hash) parsed.hash = hash;
	if (search) parsed.search = search;
	if (to) parsed.pathname = to;

	return parsed;
}

/** React Router's `createPath`: the parts back as one string, prefixes added when missing. */
function createPath({
	pathname = '/',
	search = '',
	hash = ''
}: Partial<Path>): string {
	let path = pathname;

	if (search && search !== '?') {
		path += search.charAt(0) === '?' ? search : `?${search}`;
	}

	if (hash && hash !== '#') {
		path += hash.charAt(0) === '#' ? hash : `#${hash}`;
	}

	return path;
}

/** A `To` in the shape the TanStack router takes. */
interface ResolvedTo {
	/** The pathname, basepath-free and verbatim (no route template is interpolated). */
	to: string;
	/** The query string parsed to wire values; the route middlewares serialize it back. */
	search: Wire;
	/** The fragment without its `#`, or `undefined` for none (the router then writes none). */
	hash: string | undefined;
}

/**
 * Resolves a React Router `To` the way `useNavigate`/`<Link>` did: a missing
 * or empty pathname means the current one (so `{ search }` rewrites the
 * query string in place), and a missing hash drops the current fragment.
 */
function resolveTo(to: To, currentPathname: string): ResolvedTo {
	const parts =
		typeof to === 'string'
			? splitTo(to)
			: { to: to.pathname ?? '', search: to.search ?? '', hash: to.hash ?? '' };
	const hash = parts.hash.replace(/^#/, '');

	return {
		to: parts.to || currentPathname,
		search: parseSearch(parts.search),
		hash: hash || undefined
	};
}

export { createPath, parsePath, resolveTo };
export type { Path, ResolvedTo, To };
