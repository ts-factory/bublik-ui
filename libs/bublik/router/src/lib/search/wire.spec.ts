/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { compressToEncodedURIComponent } from 'lz-string';

import {
	paramTables,
	sidebarStateBlobs,
	snapshotQueries,
	specLiteralQueries
} from '../../test/corpus';
import { isOldUrl } from '../parsing';
import { parseSearch, stringifySearch } from './wire';

describe('parseSearch', () => {
	it('reads every value as a string, repeated keys as an array', () => {
		expect(
			parseSearch(
				'?page=1&tv=1&legacy=true&focusId=0336&lineNumber=1_42&x=%22q%22&project=1&project=2'
			)
		).toEqual({
			page: '1',
			tv: '1',
			legacy: 'true',
			focusId: '0336',
			lineNumber: '1_42',
			x: '"q"',
			project: ['1', '2']
		});
	});

	it('accepts the query string with or without the leading question mark', () => {
		expect(parseSearch('a=1')).toEqual({ a: '1' });
		expect(parseSearch('?a=1')).toEqual({ a: '1' });
		expect(parseSearch('')).toEqual({});
		expect(parseSearch('?')).toEqual({});
	});

	it('keeps an empty value as the empty string', () => {
		expect(parseSearch('?search=&mode=rows')).toEqual({
			search: '',
			mode: 'rows'
		});
	});
});

describe('stringifySearch', () => {
	it('writes arrays as repeated keys and prefixes the question mark', () => {
		expect(stringifySearch({ project: ['1', '2'], page: '3' })).toBe(
			'?project=1&project=2&page=3'
		);
	});

	it('drops undefined and null, keeps the empty string as key=', () => {
		expect(stringifySearch({ search: '', page: undefined, mode: null })).toBe(
			'?search='
		);
		expect(stringifySearch({})).toBe('');
		expect(stringifySearch({ page: undefined })).toBe('');
	});

	it('encodes like URLSearchParams: + for spaces, %2B for a plus', () => {
		expect(stringifySearch({ q: 'a b', blob: 'x+y' })).toBe(
			'?q=a+b&blob=x%2By'
		);
	});

	it('keeps the position of an existing key on spread and appends new ones', () => {
		const prev = parseSearch('?page=1&_s=x');

		expect(stringifySearch({ ...prev, page: '2', mode: 'table' })).toBe(
			'?page=2&_s=x&mode=table'
		);
	});
});

/**
 * `stringifySearch(parseSearch(s)) === s` for everything the app writes
 * today. The URL snapshot stores values percent-decoded (its `lz:`/`json:`
 * blobs are canonicalized), so snapshot strings are compared decoded and
 * checked for idempotence; byte equality is asserted for every string that is
 * already in `URLSearchParams` form, which is all the rest of the corpus.
 */
describe('round-trips the e2e oracles', () => {
	const roundTrip = (query: string) =>
		stringifySearch(parseSearch(query)).slice(1);
	const decoded = (query: string) =>
		query
			.split('&')
			.map((pair) =>
				pair
					.split('=')
					.map((part) => decodeURIComponent(part.replace(/\+/g, ' ')))
					.join('=')
			)
			.join('&');
	const inWireForm = (query: string) =>
		new URLSearchParams(query).toString() === query;

	const snapshot = snapshotQueries();
	const literals = specLiteralQueries();

	it('has a non-trivial corpus', async () => {
		expect(snapshot.length).toBeGreaterThan(20);
		expect(literals.length).toBeGreaterThan(5);
		expect((await paramTables()).queries.length).toBeGreaterThan(50);
	});

	it.each(snapshot)('snapshot: %s', (query) => {
		expect(decoded(roundTrip(query))).toBe(decoded(query));
		expect(roundTrip(roundTrip(query))).toBe(roundTrip(query));
		if (inWireForm(query)) expect(roundTrip(query)).toBe(query);
	});

	it('only the canonicalized lz:/json: snapshot values are not in wire form', () => {
		const notWire = snapshot.filter((query) => !inWireForm(query));

		expect(
			notWire.every((query) =>
				/(^|&)(expanded|globalFilter|rowState)=/.test(query)
			)
		).toBe(true);
	});

	it.each(literals)('spec literal: %s', (query) => {
		expect(decoded(roundTrip(query))).toBe(decoded(query));
		expect(roundTrip(roundTrip(query))).toBe(roundTrip(query));
	});

	it('every documented value of every *_URL_PARAMS table', async () => {
		const failures = (await paramTables()).queries.filter(
			(query) => roundTrip(query) !== query
		);

		expect(failures).toEqual([]);
	});

	it('sidebar _s blobs, written as %2B so the + inside survives', async () => {
		for (const { values, blob } of await sidebarStateBlobs()) {
			// The fixture still encodes `[3, values]` with lz-string.
			expect(blob).toBe(
				compressToEncodedURIComponent(JSON.stringify([3, values]))
			);

			const wire = new URLSearchParams({ _s: blob }).toString();

			expect(roundTrip(wire)).toBe(wire);
			expect(parseSearch(wire)._s).toBe(blob);
		}
	});

	it('a legacy ~ jsurl link keeps its value, so the jsurl redirect still recognizes it', () => {
		const legacy = "testName=~'foo&page=~1";
		const wire = roundTrip(legacy);

		expect(decoded(wire)).toBe(decoded(legacy));
		expect(roundTrip(wire)).toBe(wire);
		expect(isOldUrl(legacy)).toBe(true);
		expect(isOldUrl(wire)).toBe(true);
	});
});
