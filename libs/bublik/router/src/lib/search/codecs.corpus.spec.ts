/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';

import {
	paramTables,
	queryOf,
	sidebarStateBlobs,
	snapshotUrls,
	specLiteralQueries
} from '../../test/corpus';
import { codecFor, routePattern, TABLE_ROUTES } from '../../test/route-codecs';
import { compressedJson, str, type Codec } from './codecs';
import { parseSearch, stringifySearch } from './wire';

/**
 * `serialize(parse(w)) === w` for every (page, key, value) the e2e oracles
 * pin, through the codec that page's key uses. The URL snapshot canonicalizes
 * compressed and JSON values to `lz:{...}`/`json:{...}`; those are turned back
 * into the blob the app would have written (compressed, or plain JSON) first.
 */
interface Sample {
	route: string;
	key: string;
	wire: string | string[];
}

function samples(): Sample[] {
	const out: Sample[] = [];
	const seen = new Set<string>();

	const add = (route: string, query: string) => {
		for (const [key, value] of Object.entries(parseSearch(query))) {
			const wire = Array.isArray(value)
				? value.map(realValue)
				: realValue(value);
			const id = `${route} ${key}=${JSON.stringify(wire)}`;

			if (seen.has(id)) continue;
			seen.add(id);
			out.push({ route, key, wire });
		}
	};

	for (const url of snapshotUrls()) {
		const query = queryOf(url);
		if (!query) continue;

		add(routePattern(url.split('?')[0]), query);
	}

	for (const query of specLiteralQueries()) add('(spec literal)', query);

	return out;
}

/** A snapshot value the app would really have written. */
function realValue(value: string): string {
	if (value.startsWith('lz:')) {
		return compressToEncodedURIComponent(value.slice('lz:'.length));
	}
	if (value.startsWith('json:')) return value.slice('json:'.length);

	return value;
}

describe('every codec round-trips its keys in the e2e oracles', () => {
	const corpus = samples();

	it('has a non-trivial corpus', () => {
		expect(corpus.length).toBeGreaterThan(100);
	});

	it('maps every key of every *_URL_PARAMS table to a codec', async () => {
		const { entries } = await paramTables();
		const unmapped = Object.keys(entries).filter((id) => {
			const [table, key] = id.split('.');
			const route = TABLE_ROUTES[table];

			return route !== undefined && !codecFor(route, key);
		});

		expect(unmapped).toEqual([]);
		expect(Object.keys(entries).length).toBeGreaterThan(100);
	});

	// A single-value codec handed a repeated key (a sidebar link carrying
	// another page's `runIds=a&runIds=b` onto `/history`) reads it as typed
	// input; that is the one shape the oracles contain that is not a wire value
	// the page itself writes.
	const roundTrips = corpus.filter(({ route, key, wire }) => {
		const codec = codecFor(route, key);

		return codec && !(Array.isArray(wire) && isSingleValued(codec));
	});

	it.each(roundTrips)('$route $key=$wire', ({ route, key, wire }) => {
		const codec = codecFor(route, key);
		const parsed = codec?.parse(wire);

		// Compared as query strings: `['1']` and `'1'` are the same bytes.
		expect(stringifySearch({ [key]: codec?.serialize(parsed) })).toBe(
			stringifySearch({ [key]: wire })
		);
		// Idempotent on typed input: a second validation is a no-op.
		expect(codec?.parse(parsed)).toEqual(parsed);
	});

	it('no codec rewrites a documented table value: it round-trips or reads as absent', async () => {
		const { entries } = await paramTables();
		const absent: string[] = [];

		for (const [id, meta] of Object.entries(entries)) {
			const [table, key] = id.split('.');
			const route = TABLE_ROUTES[table];
			const codec = route && codecFor(route, key);
			if (!codec) continue;

			for (const value of String(meta.values ?? '')
				.split('|')
				.map((it) => it.trim())
				.filter(Boolean)) {
				const parsed = codec.parse(value);

				if (
					parsed === undefined ||
					(Array.isArray(parsed) && parsed.length === 0)
				) {
					absent.push(`${id}=${value}`);
					continue;
				}

				expect(stringifySearch({ [key]: codec.serialize(parsed) })).toBe(
					stringifySearch({ [key]: value })
				);
			}
		}

		// The tables describe these values ("YYYY-MM-DD", "page number",
		// "a map of row id to true") instead of spelling one out, so the lossy
		// codecs read the description as garbage; no other key reads as absent.
		const absentKeys = new Set(absent.map((id) => id.split(/[.=]/)[1]));

		expect([...absentKeys].sort()).toEqual([
			'columnFilters',
			'columnOrder',
			'columnVisibility',
			'expanded',
			'globalFilter',
			'legacy',
			'main',
			'page',
			'project',
			'rowState',
			'secondary',
			'selectedCharts',
			'sorting',
			'targetIterationId',
			'visibility'
		]);
	});

	it('spec literals without a page round-trip through the raw string codec', () => {
		for (const { route, key, wire } of corpus) {
			if (route.startsWith('/') || Array.isArray(wire)) continue;

			expect(str().serialize(str().parse(wire))).toBe(wire);
			expect(key).not.toBe('');
		}
	});

	it('sidebar _s blobs round-trip as opaque strings and decode as compressed JSON', async () => {
		for (const { values, blob } of await sidebarStateBlobs()) {
			expect(str().serialize(str().parse(blob))).toBe(blob);
			expect(compressedJson().parse(blob)).toEqual([3, values]);
			expect(compressedJson().serialize(compressedJson().parse(blob))).toBe(
				blob
			);
		}
	});
});

/** Whether the codec writes one value per key (as opposed to a repeated key). */
function isSingleValued(codec: Codec<unknown>): boolean {
	return !Array.isArray(codec.serialize(['x']));
}
