/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';

import {
	bool01,
	boolTrue,
	compressedJson,
	date,
	delimited,
	enumOf,
	json,
	num,
	passthrough,
	repeated,
	repeatedNum,
	str
} from './codecs';

// Expected values mirror the encoders in use today: `serialize-query-params`
// (StringParam, NumberParam, BooleanParam, DateParam, JsonParam, ArrayParam,
// NumericArrayParam), the lz-string helpers in the sidebar lib, the `;`-joined
// list helpers of the history slice, and `searchParams.get` for raw strings.

describe('str', () => {
	it('keeps the wire string, the empty string included', () => {
		expect(str().parse('abc')).toBe('abc');
		expect(str().parse('')).toBe('');
		expect(str().parse('0336')).toBe('0336');
		expect(str().serialize('abc')).toBe('abc');
		expect(str().serialize('')).toBe('');
	});

	it('absent stays absent', () => {
		expect(str().parse(undefined)).toBeUndefined();
		expect(str().serialize(undefined)).toBeUndefined();
	});

	it('reads the first of a repeated key (StringParam)', () => {
		expect(str().parse(['a', 'b'])).toBe('a');
	});

	it('is idempotent on typed input and stringifies a scalar handed in by a link', () => {
		expect(str().parse(str().parse('abc'))).toBe('abc');
		expect(str().parse(42)).toBe('42');
	});
});

describe('num', () => {
	it('reads a number and writes String(n) (NumberParam)', () => {
		expect(num().parse('2')).toBe(2);
		expect(num().parse('-1.5')).toBe(-1.5);
		expect(num().serialize(2)).toBe('2');
	});

	it('absent, empty and unparsable become undefined', () => {
		expect(num().parse(undefined)).toBeUndefined();
		expect(num().parse('')).toBeUndefined();
		expect(num().parse('abc')).toBeUndefined();
		expect(num().parse(Number.NaN)).toBeUndefined();
		expect(num().serialize(undefined)).toBeUndefined();
	});

	it('is idempotent on typed input and reads the first of a repeated key', () => {
		expect(num().parse(2)).toBe(2);
		expect(num().parse(['3', '4'])).toBe(3);
	});
});

describe('bool01', () => {
	it('reads 1/0 and writes 1/0 (BooleanParam)', () => {
		expect(bool01().parse('1')).toBe(true);
		expect(bool01().parse('0')).toBe(false);
		expect(bool01().serialize(true)).toBe('1');
		expect(bool01().serialize(false)).toBe('0');
	});

	it('anything else is undefined, true/false included, so the page keeps its default', () => {
		expect(bool01().parse(undefined)).toBeUndefined();
		expect(bool01().parse('')).toBeUndefined();
		expect(bool01().parse('true')).toBeUndefined();
		expect(bool01().parse('maybe')).toBeUndefined();
		expect(bool01().serialize(undefined)).toBeUndefined();
	});

	it('is idempotent on typed input', () => {
		expect(bool01().parse(true)).toBe(true);
		expect(bool01().parse(false)).toBe(false);
	});
});

describe('boolTrue', () => {
	it('reads true/false and writes true/false', () => {
		expect(boolTrue().parse('true')).toBe(true);
		expect(boolTrue().parse('false')).toBe(false);
		expect(boolTrue().serialize(true)).toBe('true');
		expect(boolTrue().serialize(false)).toBe('false');
	});

	it('anything else is undefined, 1/0 included', () => {
		expect(boolTrue().parse(undefined)).toBeUndefined();
		expect(boolTrue().parse('1')).toBeUndefined();
		expect(boolTrue().parse('')).toBeUndefined();
	});

	it('is idempotent on typed input', () => {
		expect(boolTrue().parse(true)).toBe(true);
	});
});

describe('date', () => {
	it('reads YYYY-MM-DD as a local date and writes it back (DateParam)', () => {
		const parsed = date().parse('2026-04-19');

		expect(parsed).toBeInstanceOf(Date);
		expect([
			parsed?.getFullYear(),
			parsed?.getMonth(),
			parsed?.getDate()
		]).toEqual([2026, 3, 19]);
		expect(date().serialize(parsed)).toBe('2026-04-19');
		expect(date().serialize(new Date(2026, 0, 5))).toBe('2026-01-05');
	});

	it('normalizes a sloppy date the way DateParam does when it is written back', () => {
		expect(date().serialize(date().parse('2026-4-9'))).toBe('2026-04-09');
	});

	it('absent and unparsable become undefined', () => {
		expect(date().parse(undefined)).toBeUndefined();
		expect(date().parse('')).toBeUndefined();
		expect(date().parse('YYYY-MM-DD')).toBeUndefined();
		expect(date().parse('2026-04')).toBeUndefined();
		expect(date().parse(new Date('nope'))).toBeUndefined();
		expect(date().serialize(undefined)).toBeUndefined();
	});

	it('is idempotent on typed input', () => {
		const typed = new Date(2026, 3, 19);

		expect(date().parse(typed)).toBe(typed);
	});
});

describe('json', () => {
	it('reads and writes plain JSON (JsonParam)', () => {
		expect(json().parse('{"0":true}')).toEqual({ '0': true });
		expect(json<string[]>().parse('["a","b"]')).toEqual(['a', 'b']);
		expect(json().serialize({ '0': true })).toBe('{"0":true}');
	});

	it('absent and unparsable become undefined', () => {
		expect(json().parse(undefined)).toBeUndefined();
		expect(json().parse('nope')).toBeUndefined();
		expect(json().parse('')).toBeUndefined();
		expect(json().serialize(undefined)).toBeUndefined();
	});

	it('is idempotent on typed input, a typed list included', () => {
		const typed = { a: 1 };
		const list = ['total', 'passed'];

		expect(json().parse(typed)).toBe(typed);
		expect(json().parse(list)).toBe(list);
	});
});

describe('compressedJson', () => {
	const state = { '2_1': true, '2_1_3_2': true };
	const blob = compressToEncodedURIComponent(JSON.stringify(state));

	it('reads an lz-string blob and writes the same blob back', () => {
		expect(compressedJson().parse(blob)).toEqual(state);
		expect(compressedJson().serialize(state)).toBe(blob);
	});

	it('falls back to legacy plain JSON on read and writes it back compressed', () => {
		expect(compressedJson().parse('{"2_1":true,"2_1_3_2":true}')).toEqual(
			state
		);
		expect(
			compressedJson().parse(encodeURIComponent('{"2_1":true,"2_1_3_2":true}'))
		).toEqual(state);
		expect(
			compressedJson().serialize(
				compressedJson().parse('{"2_1":true,"2_1_3_2":true}')
			)
		).toBe(blob);
	});

	it('absent and unparsable become undefined', () => {
		expect(compressedJson().parse(undefined)).toBeUndefined();
		expect(compressedJson().parse('')).toBeUndefined();
		expect(compressedJson().parse('not-a-blob')).toBeUndefined();
		expect(compressedJson().serialize(undefined)).toBeUndefined();
	});

	it('is idempotent on typed input and returns the same object for the same blob', () => {
		const list = [{ columnId: 'FAILED', rowId: '1' }];

		expect(compressedJson().parse(state)).toBe(state);
		expect(compressedJson().parse(list)).toBe(list);
		expect(compressedJson().parse(blob)).toBe(compressedJson().parse(blob));
	});
});

describe('repeated', () => {
	it('reads one key per value and writes the array back (ArrayParam)', () => {
		expect(repeated().parse(['a', 'b'])).toEqual(['a', 'b']);
		expect(repeated().parse('a')).toEqual(['a']);
		expect(repeated().serialize(['a', 'b'])).toEqual(['a', 'b']);
	});

	it('an empty value is an empty list; an empty list writes nothing', () => {
		expect(repeated().parse('')).toEqual([]);
		expect(repeated().serialize([])).toEqual([]);
	});

	it('absent stays absent', () => {
		expect(repeated().parse(undefined)).toBeUndefined();
		expect(repeated().serialize(undefined)).toBeUndefined();
	});
});

describe('repeatedNum', () => {
	it('reads one key per value as numbers and writes them back as strings (NumericArrayParam)', () => {
		expect(repeatedNum().parse(['1', '2'])).toEqual([1, 2]);
		expect(repeatedNum().parse('3')).toEqual([3]);
		expect(repeatedNum().serialize([1, 2])).toEqual(['1', '2']);
	});

	it('drops entries that are not numbers', () => {
		expect(repeatedNum().parse(['1', 'x', ''])).toEqual([1]);
		expect(repeatedNum().parse('')).toEqual([]);
	});

	it('absent stays absent and typed input is kept', () => {
		expect(repeatedNum().parse(undefined)).toBeUndefined();
		expect(repeatedNum().parse([1, 2])).toEqual([1, 2]);
	});
});

describe('delimited', () => {
	it('reads a delimiter-joined list and joins it back', () => {
		expect(delimited(';').parse('a;b')).toEqual(['a', 'b']);
		expect(delimited(';').parse('a')).toEqual(['a']);
		expect(delimited(';').serialize(['a', 'b'])).toBe('a;b');
	});

	it('an empty value is an empty list; an empty list writes key= (history writers emit empty keys)', () => {
		expect(delimited(';').parse('')).toEqual([]);
		expect(delimited(';').serialize([])).toBe('');
	});

	it('can drop the key for an empty list instead (classification facets)', () => {
		expect(delimited(';', { dropEmpty: true }).serialize([])).toBeUndefined();
		expect(delimited(';', { dropEmpty: true }).serialize(['a'])).toBe('a');
	});

	it('absent stays absent and typed input is kept', () => {
		expect(delimited(';').parse(undefined)).toBeUndefined();
		expect(delimited(';').parse(['a', 'b'])).toEqual(['a', 'b']);
	});
});

describe('enumOf', () => {
	const mode = enumOf(['rows', 'rows-line', 'columns']);

	it('reads a known value', () => {
		expect(mode.parse('rows')).toBe('rows');
		expect(mode.serialize('columns')).toBe('columns');
	});

	it('keeps an unknown value as the raw string so the URL is never rewritten', () => {
		expect(mode.parse('bogus')).toBe('bogus');
		expect(mode.serialize(mode.parse('bogus'))).toBe('bogus');
	});

	it('absent stays absent and the first of a repeated key is read', () => {
		expect(mode.parse(undefined)).toBeUndefined();
		expect(mode.parse(['rows', 'columns'])).toBe('rows');
	});
});

describe('passthrough', () => {
	it('hands the wire value through untouched, arrays included', () => {
		expect(passthrough().parse('1')).toBe('1');
		expect(passthrough().parse(['a', 'b'])).toEqual(['a', 'b']);
		expect(passthrough().serialize(['a', 'b'])).toEqual(['a', 'b']);
		expect(passthrough().parse(undefined)).toBeUndefined();
	});
});
