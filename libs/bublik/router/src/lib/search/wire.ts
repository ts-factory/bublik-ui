/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * What a query string looks like once parsed and before it is stringified:
 * every value is a string, a repeated key is an array of strings, nothing is
 * coerced. Per-route codecs (`defineSearch`) turn this into typed values and
 * back; the router itself only ever sees `Wire`.
 */
type Wire = Record<string, string | string[]>;

/**
 * `URLSearchParams` in, `Wire` out. `?page=1&project=1&project=2` becomes
 * `{ page: '1', project: ['1', '2'] }`; a leading `?` is optional.
 */
function parseSearch(searchStr: string): Wire {
	const out: Wire = {};

	for (const [key, value] of new URLSearchParams(searchStr)) {
		const prev = out[key];

		out[key] =
			prev === undefined
				? value
				: Array.isArray(prev)
				? [...prev, value]
				: [prev, value];
	}

	return out;
}

/**
 * `Wire` (or anything `String()` can serialize) in, `?a=1&b=2` out, written by
 * `URLSearchParams` so the bytes match what the app writes today: `+` for a
 * space, insertion order kept, arrays as repeated keys, `undefined`/`null`
 * dropped, the empty string kept as `key=`. Returns `''` when nothing is left.
 */
function stringifySearch(search: Record<string, unknown>): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(search)) {
		if (value === undefined || value === null) continue;

		if (Array.isArray(value)) {
			for (const item of value) params.append(key, String(item ?? ''));
		} else {
			params.append(key, String(value));
		}
	}

	const searchStr = params.toString();

	return searchStr ? `?${searchStr}` : '';
}

export { parseSearch, stringifySearch };
export type { Wire };
