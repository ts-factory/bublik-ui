/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { convertOldUrlSearch, isOldUrl } from './parsing';

const base64Json = (value: unknown) =>
	encodeURIComponent(btoa(JSON.stringify(value)));

describe('convertOldUrlSearch: a legacy jsurl search in the legacy codec', () => {
	it.each([
		['a string, current prefix', '?a=~-x*2fy', '?a=x%2Fy'],
		["a string, old ' prefix", "?a=~'x*20y", '?a=x%20y'],
		["an encoded ' prefix", '?a=~%27x', '?a=x'],
		['a $ escaped as !', "?a=~'a!b", '?a=a%24b'],
		['a two-byte escape', "?a=~'**00e9", '?a=%C3%A9'],
		['a number', '?n=~25', '?n=25'],
		['a float', '?n=~1.5', '?n=1.5'],
		['a leading dash, read as the string prefix', '?n=~-1.5', '?n=1.5'],
		['keywords', '?b=~true&c=~false&d=~null', '?b=true&c=false&d=null'],
		['a list', '?runIds=~(~1~2)', `?runIds=${base64Json([1, 2])}`],
		['an empty list', '?l=~(~)', `?l=${base64Json([])}`],
		['an object', "?o=~(a~1~b~'x)", `?o=${base64Json({ a: 1, b: 'x' })}`],
		[
			'a nested object',
			"?o=~(a~(~'x~'y)~b~(c~true))",
			`?o=${base64Json({ a: ['x', 'y'], b: { c: true } })}`
		],
		['an empty object', '?o=~()', `?o=${base64Json({})}`],
		['a plain value next to a jsurl one', "?p=abc&a=~'x", '?p=abc&a=x'],
		['a numeric plain value', '?p=12&a=~1', '?p=12&a=1'],
		['an unknown keyword, kept', '?a=~zzz', '?a=~zzz'],
		['a tilde inside a plain value, kept', '?a=x~y', '?a=x~y'],
		['nothing', '?', '']
	])('%s: %s → %s', (_, search, expected) => {
		expect(convertOldUrlSearch(search)).toBe(expected);
	});
});

describe('isOldUrl', () => {
	it.each([
		['?a=~1', true],
		['?a=%7E1', true],
		['?a=1', false]
	])('%s → %s', (search, expected) => {
		expect(isOldUrl(search)).toBe(expected);
	});
});
