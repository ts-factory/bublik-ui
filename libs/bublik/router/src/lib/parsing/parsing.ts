/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { decode, encode } from './decoders';
import { parseSearch as JsurlParseSearch } from 'react-location-jsurl';

export const encodeToBinary = (str: string): string => {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
			return String.fromCharCode(parseInt(p1, 16));
		})
	);
};

export const decodeFromBinary = (str: string): string => {
	return decodeURIComponent(
		Array.prototype.map
			.call(atob(str), (c) => {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join('')
	);
};

export const isOldUrl = (searchStr: string) => {
	return searchStr.includes('~') || searchStr.includes('%7E');
};

export const handleOldUrlParsing = (searchStr: string) => {
	const query: Record<string, unknown> = JsurlParseSearch(searchStr);

	window.location.replace(
		`${window.location.pathname}${stringifySearch(query)}`
	);
};

export const parseSearchWith = (parser: (str: string) => unknown) => {
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

export const stringifySearchWith = (stringify: (search: unknown) => string) => {
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

export const defaultParser = (value: string) => {
	return JSON.parse(decodeFromBinary(value));
};

export const defaultStringifier = (value: unknown) => {
	return encodeToBinary(JSON.stringify(value));
};

export const parseSearch = parseSearchWith(defaultParser);
export const stringifySearch = stringifySearchWith(defaultStringifier);
