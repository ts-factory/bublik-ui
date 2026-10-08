/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent
} from 'lz-string';

/** A value as it appears on the wire: one string, one string per repeat, or absent. */
type WireValue = string | string[] | undefined;

/**
 * One query key's encoding. Every codec obeys the same rules, so URLs do not
 * drift:
 *
 * - `serialize(parse(wire)) === wire` for every wire value the app writes;
 * - `parse` accepts an already-typed value unchanged (the router hands
 *   navigations the *validated* search, never the raw string);
 * - absent is `undefined` both ways, and `serialize(undefined)` removes the key;
 * - no codec fills a default; defaults belong to `defineSearch(shape, defaults)`;
 * - a lossy codec (`num`, `bool01`, `boolTrue`, `date`, `json`, `compressedJson`)
 *   parses garbage to `undefined`; `enumOf` keeps the raw string instead.
 */
interface Codec<T> {
	parse(raw: unknown): T | undefined;
	serialize(value: T | undefined): WireValue;
}

const isAbsent = (raw: unknown): raw is null | undefined =>
	raw === undefined || raw === null;

/**
 * The first string of a wire value, or `undefined` when absent. A number or
 * boolean handed in by a link builder (`focusId: 42`) is stringified.
 */
function firstString(raw: unknown): string | undefined {
	if (isAbsent(raw)) return undefined;
	if (Array.isArray(raw)) return raw.length ? String(raw[0]) : undefined;

	return typeof raw === 'object' ? undefined : String(raw);
}

/** Raw string. Mirrors `StringParam` and `searchParams.get`. */
function str(): Codec<string> {
	return {
		parse: firstString,
		serialize: (value) => value
	};
}

/** `String(n)` on the wire. Mirrors `NumberParam` and `Number(get(...))`; NaN and `''` are absent. */
function num(): Codec<number> {
	return {
		parse: (raw) => {
			if (typeof raw === 'number') return Number.isNaN(raw) ? undefined : raw;

			const text = firstString(raw);
			if (text === undefined || text === '') return undefined;

			const value = Number(text);

			return Number.isNaN(value) ? undefined : value;
		},
		serialize: (value) => (value === undefined ? undefined : String(value))
	};
}

/**
 * A boolean with one wire spelling per value; anything else reads as absent.
 * For keys with their own spellings, such as the history form's
 * `untriaged=true`/`untriaged=`; `bool01` and `boolTrue` are the common pairs.
 */
function boolOf(trueWire: string, falseWire: string): Codec<boolean> {
	return {
		parse: (raw) => {
			if (typeof raw === 'boolean') return raw;

			const text = firstString(raw);
			if (text === trueWire) return true;
			if (text === falseWire) return false;

			return undefined;
		},
		serialize: (value) =>
			value === undefined ? undefined : value ? trueWire : falseWire
	};
}

/**
 * `1`/`0` on the wire. Mirrors `BooleanParam`, which also reads `true`/`false`
 * as absent: `?tv=true` is "off" today, and reading it as "on" would both flip
 * the page and rewrite the URL to `tv=1`.
 */
function bool01(): Codec<boolean> {
	return boolOf('1', '0');
}

/** `true`/`false` on the wire (the log page's `legacy`): anything else is absent. */
function boolTrue(): Codec<boolean> {
	return boolOf('true', 'false');
}

const pad2 = (value: number) => (value < 10 ? `0${value}` : String(value));

/** Local `YYYY-MM-DD` on the wire. Mirrors `DateParam`, including its lenient read. */
function date(): Codec<Date> {
	const isValid = (value: Date) => !Number.isNaN(value.getTime());

	return {
		parse: (raw) => {
			if (raw instanceof Date) return isValid(raw) ? raw : undefined;

			const text = firstString(raw);
			if (text === undefined || text === '') return undefined;

			// As `decodeDate`: a bare year is 1 January, a missing day is invalid.
			const [year, month, day] = text.split('-');
			const value =
				month === undefined
					? new Date(Number(year), 0, 1)
					: new Date(Number(year), Number(month) - 1, Number(day));

			return isValid(value) ? value : undefined;
		},
		serialize: (value) =>
			value === undefined
				? undefined
				: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
						value.getDate()
				  )}`
	};
}

function tryParseJson<T>(text: string): T | undefined {
	try {
		return JSON.parse(text) as T;
	} catch {
		return undefined;
	}
}

/**
 * Plain `JSON.stringify` on the wire. Mirrors `JsonParam`. Only a string is
 * decoded: an array is a typed value (`columnOrder` is a list), not a repeated
 * key, which no JSON key is written as.
 */
function json<T = unknown>(): Codec<T> {
	return {
		parse: (raw) => {
			if (isAbsent(raw)) return undefined;
			if (typeof raw !== 'string') return raw as T;

			return tryParseJson<T>(raw);
		},
		serialize: (value) =>
			value === undefined ? undefined : JSON.stringify(value)
	};
}

/**
 * The last decoded blobs, by input string. Every `Link` render re-validates
 * the current location through every codec, so the lz-string decode must not
 * run on every render; the cache also keeps the decoded object referentially
 * stable for the same blob.
 */
const COMPRESSED_CACHE_SIZE = 64;
const compressedCache = new Map<string, unknown>();

function decodeCompressedOrJson<T>(text: string): T | undefined {
	if (compressedCache.has(text)) return compressedCache.get(text) as T;

	let value: T | undefined;
	const inflated = decompressFromEncodedURIComponent(text);
	if (inflated) value = tryParseJson<T>(inflated);

	// Legacy plain-JSON values, written before the state was compressed; some
	// of them were percent-encoded a second time.
	if (value === undefined) value = tryParseJson<T>(text);
	if (value === undefined) {
		try {
			value = tryParseJson<T>(decodeURIComponent(text));
		} catch {
			value = undefined;
		}
	}

	if (value !== undefined) {
		if (compressedCache.size >= COMPRESSED_CACHE_SIZE) {
			const oldest = compressedCache.keys().next().value;
			if (oldest !== undefined) compressedCache.delete(oldest);
		}
		compressedCache.set(text, value);
	}

	return value;
}

/**
 * lz-string compressed JSON on the wire, with a plain-JSON fallback on read.
 * Mirrors the run table's `CompressedJsonParam`: a legacy plain value is read
 * as today and written back compressed. As with `json`, an array is typed.
 */
function compressedJson<T = unknown>(): Codec<T> {
	return {
		parse: (raw) => {
			if (isAbsent(raw)) return undefined;
			if (typeof raw !== 'string') return raw as T;
			if (raw === '') return undefined;

			return decodeCompressedOrJson<T>(raw);
		},
		serialize: (value) =>
			value === undefined
				? undefined
				: compressToEncodedURIComponent(JSON.stringify(value))
	};
}

/** `key=` is `[]`; otherwise one entry per repeat (`ArrayParam`, `getAll`). */
function listOf(raw: unknown): string[] | undefined {
	if (isAbsent(raw)) return undefined;
	if (Array.isArray(raw)) return raw.map(String);

	return raw === '' ? [] : [String(raw)];
}

/** One key per value on the wire. Mirrors `ArrayParam` and `getAll`. */
function repeated(): Codec<string[]> {
	return {
		parse: listOf,
		serialize: (value) => value
	};
}

/**
 * One key per value, as numbers. Mirrors `NumericArrayParam`, except that an
 * entry which is not a number is dropped rather than kept as `NaN`.
 */
function repeatedNum(): Codec<number[]> {
	return {
		parse: (raw) => {
			const list = listOf(raw);
			if (list === undefined) return undefined;

			return list
				.filter((item) => item !== '')
				.map(Number)
				.filter((item) => !Number.isNaN(item));
		},
		serialize: (value) => (value === undefined ? undefined : value.map(String))
	};
}

interface DelimitedOptions {
	/** Write nothing for an empty list instead of `key=`. */
	dropEmpty?: boolean;
}

/**
 * A delimiter-joined list on one key. Mirrors the history slice's
 * `parseArray`/`arrayToString` (`key=` is `[]`, written back as `key=`) and,
 * with `dropEmpty`, the classification facets (an empty list drops the key).
 */
function delimited(
	delimiter: string,
	options: DelimitedOptions = {}
): Codec<string[]> {
	return {
		parse: (raw) => {
			if (isAbsent(raw)) return undefined;
			// An array is a typed list: no delimited key is written as a repeated key.
			if (Array.isArray(raw)) return raw.map(String);

			const text = String(raw);

			return text === '' ? [] : text.split(delimiter);
		},
		serialize: (value) => {
			if (value === undefined) return undefined;
			if (!value.length && options.dropEmpty) return undefined;

			return value.join(delimiter);
		}
	};
}

/**
 * One of a known set of strings. An unknown value passes through as the raw
 * string (typed `T | (string & NonNullable<unknown>)`): the URL is never rewritten and the page
 * falls back exactly as it does today.
 */
function enumOf<const T extends readonly string[]>(
	values: T
): Codec<T[number] | (string & NonNullable<unknown>)> {
	return {
		parse: (raw) => {
			const text = firstString(raw);
			if (text === undefined) return undefined;

			return values.includes(text) ? (text as T[number]) : text;
		},
		serialize: (value) => value
	};
}

/** The wire value as is. For dynamic keys and keys another consumer parses itself. */
function passthrough(): Codec<string | string[]> {
	return {
		parse: (raw) => (isAbsent(raw) ? undefined : (raw as string | string[])),
		serialize: (value) => value
	};
}

/** What `validated` needs of a zod schema: `safeParse` and nothing else. */
interface Validator {
	safeParse(value: unknown): { success: boolean };
}

/**
 * A codec whose decoded value must also pass a schema (zod, in practice):
 * a value the schema rejects reads as absent, so the page shows its own
 * fallback instead of the router's error. The value is handed on as the
 * inner codec decoded it, never as the schema transformed it, so the wire
 * bytes survive the next write.
 */
function validated<T>(inner: Codec<T>, schema: Validator): Codec<T> {
	return {
		parse: (raw) => {
			const value = inner.parse(raw);
			if (value === undefined) return undefined;

			return schema.safeParse(value).success ? value : undefined;
		},
		serialize: inner.serialize
	};
}

export {
	bool01,
	boolOf,
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
	str,
	validated
};
export type { Codec, DelimitedOptions, Validator, WireValue };
