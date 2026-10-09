/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { joinTo, splitTo, type Path } from '../path/to';

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

/**
 * React Router's `createPath`: the parts back as one string, prefixes added
 * when missing. Unlike `joinTo`, an empty pathname stays empty.
 */
function createPath({
	pathname = '/',
	search = '',
	hash = ''
}: Partial<Path>): string {
	return pathname + joinTo({ to: '/', search, hash }).slice(1);
}

export { createPath, parsePath };
