/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { decode, encode } from './decoders';
import { parseJsurl } from './jsurl';

const encodeToBinary = (str: string): string => {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
			return String.fromCharCode(parseInt(p1, 16));
		})
	);
};

export const isOldUrl = (searchStr: string) => {
	return searchStr.includes('~') || searchStr.includes('%7E');
};

const parseSearchWith = (parser: (str: string) => unknown) => {
	return (searchStr: string): Record<string, unknown> => {
		if (searchStr.substring(0, 1) === '?') {
			searchStr = searchStr.substring(1);
		}

		const query: Record<string, unknown> = decode(searchStr);

		// Try to parse any query params that might be json
		for (const key in query) {
			const value = query[key];

			if (typeof value === 'string') {
				try {
					query[key] = parser(value);
				} catch (err) {
					//
				}
			}
		}

		return query;
	};
};

const stringifySearchWith = (stringify: (search: unknown) => string) => {
	return (search: Record<string, unknown>) => {
		search = { ...search };

		if (search) {
			Object.keys(search).forEach((key) => {
				const val = search[key];
				if (typeof val === 'undefined' || val === undefined) {
					delete search[key];
				} else if (val && typeof val === 'object' && val !== null) {
					try {
						search[key] = stringify(val);
					} catch (err) {
						// silent
					}
				}
			});
		}

		const searchStr = encode(search as Record<string, string>).toString();

		return searchStr ? `?${searchStr}` : '';
	};
};

const defaultStringifier = (value: unknown) => {
	return encodeToBinary(JSON.stringify(value));
};

export const stringifySearch = stringifySearchWith(defaultStringifier);

const parseJsurlSearch = parseSearchWith(parseJsurl);

/**
 * The query string a legacy jsurl (`~`) search is rewritten to: parsed as
 * jsurl, written back in the legacy codec (objects as base64 JSON), with its
 * `?`, or `''` when nothing is left. A route's `beforeLoad` redirects to it.
 */
export function convertOldUrlSearch(searchStr: string): string {
	return stringifySearch(parseJsurlSearch(searchStr));
}
