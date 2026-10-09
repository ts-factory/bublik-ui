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

/** The `parseSearch`/`stringifySearch` pair a router is created with. */
interface SearchCodec {
	parseSearch(searchStr: string): Wire;
	stringifySearch(search: Record<string, unknown>): string;
}

/**
 * `parseSearch` and `stringifySearch`, except that a search equal to the query
 * string parsed last stringifies back to that string as it was typed. TanStack
 * rebuilds the location on load and replaces the URL when the string differs,
 * which would turn a hand-typed `?state=open;closed` or
 * `?q=a%20b` into `%3B` and `+`; React Router left it as typed. A search that
 * changed is written in `URLSearchParams` form, as every write of the app was.
 * An empty search is always `''`, so a page loaded at `?` or `?&` does not hand
 * that string to every link without a query.
 *
 * "Last" is the last call: the router parses the location and stringifies its
 * rebuild in a row, but a `buildLocation({ href })` in between would make the
 * load rewrite come back (no app code does that before the first render). Any
 * href whose search equals the typed one gets the typed bytes too, a link on
 * the same page included; the decoded values are the same. One pair per router.
 */
function createSearchCodec(): SearchCodec {
	let lastParsed = { raw: '', canonical: '' };

	return {
		parseSearch(searchStr) {
			const parsed = parseSearch(searchStr);
			const raw = searchStr.replace(/^\?/, '');

			lastParsed = {
				raw: raw ? `?${raw}` : '',
				canonical: stringifySearch(parsed)
			};

			return parsed;
		},
		stringifySearch(search) {
			const canonical = stringifySearch(search);

			return canonical && canonical === lastParsed.canonical
				? lastParsed.raw
				: canonical;
		}
	};
}

export { createSearchCodec, parseSearch, stringifySearch };
export type { SearchCodec, Wire };
