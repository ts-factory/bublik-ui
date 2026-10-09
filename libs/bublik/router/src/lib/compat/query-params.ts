/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * use-query-params shaped hooks and param configs on the TanStack router.
 * Writes merge into the current query string and replace the entry, as the
 * app's `QueryParamProvider` was configured (`updateType: 'replaceIn'`), and
 * drop the hash while keeping the state, as its React Router 6 adapter did.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useRouter, type AnyRouter } from '@tanstack/react-router';

import { parseSearch } from '../search/wire';
import { currentLocation, useRenderedLocation } from '../location/location';
import { writeSearch } from '../search/use-search-writer';

/** A value as use-query-params hands it to `decode` and takes it from `encode`. */
type EncodedValue = string | (string | null)[] | null | undefined;

/**
 * serialize-query-params' `QueryParamConfig`: `D` is what `encode` takes,
 * `D2` what `decode` returns.
 */
interface QueryParamConfig<D, D2 = D> {
	encode: (value: D) => EncodedValue;
	decode: (value: EncodedValue) => D2;
	/** Accepted for source compatibility; nothing reads it. */
	equals?: (valueA: D | D2, valueB: D | D2) => boolean;
	default?: D2;
	/** Accepted for source compatibility; nothing reads it. */
	urlName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParamConfigMap = Record<string, QueryParamConfig<any, any>>;

type DecodedValueMap<M extends QueryParamConfigMap> = {
	[K in keyof M]: ReturnType<M[K]['decode']>;
};

type UrlUpdateType = 'replace' | 'replaceIn' | 'push' | 'pushIn';

type NewValueType<D> = D | ((latestValue: D) => D);

type SetQuery<M extends QueryParamConfigMap> = (
	changes:
		| Partial<DecodedValueMap<M>>
		| ((latestValues: DecodedValueMap<M>) => Partial<DecodedValueMap<M>>),
	updateType?: UrlUpdateType
) => void;

interface QueryParamOptions {
	updateType?: UrlUpdateType;
}

/** The first value of a repeated key, as serialize-query-params' `getEncodedValue`. */
function getEncodedValue(
	input: EncodedValue,
	allowEmptyString = false
): string | null | undefined {
	if (input == null) return input;

	if (input.length === 0 && (!allowEmptyString || input !== '')) return null;

	const text = Array.isArray(input) ? input[0] : input;
	if (text == null) return text;
	if (!allowEmptyString && text === '') return null;

	return text;
}

function getEncodedValueArray(
	input: EncodedValue
): (string | null)[] | null | undefined {
	if (input == null) return input;

	return Array.isArray(input) ? input : input === '' ? [] : [input];
}

const StringParam: QueryParamConfig<
	string | null | undefined,
	string | null | undefined
> = {
	encode: (value) => (value == null ? value : String(value)),
	decode: (input) => {
		const text = getEncodedValue(input, true);

		return text == null ? text : String(text);
	}
};

const NumberParam: QueryParamConfig<
	number | null | undefined,
	number | null | undefined
> = {
	encode: (value) => (value == null ? value : String(value)),
	decode: (input) => {
		const text = getEncodedValue(input);
		if (text == null) return text;
		if (text === '') return null;

		return +text;
	}
};

const BooleanParam: QueryParamConfig<
	boolean | null | undefined,
	boolean | null | undefined
> = {
	encode: (value) => (value == null ? value : value ? '1' : '0'),
	decode: (input) => {
		const text = getEncodedValue(input);
		if (text == null) return text;
		if (text === '1') return true;
		if (text === '0') return false;

		return null;
	}
};

const pad2 = (value: number) => (value < 10 ? `0${value}` : String(value));

const DateParam: QueryParamConfig<
	Date | null | undefined,
	Date | null | undefined
> = {
	encode: (value) =>
		value == null
			? value
			: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
					value.getDate()
			  )}`,
	decode: (input) => {
		const text = getEncodedValue(input);
		if (text == null) return text;

		const [year, month, day] = text.split('-');
		const decoded =
			month == null
				? new Date(Number(year), 0, 1)
				: new Date(Number(year), Number(month) - 1, Number(day));

		return Number.isNaN(decoded.getTime()) ? null : decoded;
	}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JsonParam: QueryParamConfig<any, any> = {
	encode: (value) => (value == null ? value : JSON.stringify(value)),
	decode: (input) => {
		const text = getEncodedValue(input);
		if (text == null) return text;

		try {
			return JSON.parse(text);
		} catch {
			return null;
		}
	}
};

const ArrayParam: QueryParamConfig<
	(string | null)[] | null | undefined,
	(string | null)[] | null | undefined
> = {
	encode: (value) => value,
	decode: getEncodedValueArray
};

const NumericArrayParam: QueryParamConfig<
	(number | null)[] | null | undefined,
	(number | null)[] | null | undefined
> = {
	encode: (value) => (value == null ? value : value.map(String)),
	decode: (input) => {
		const list = getEncodedValueArray(input);
		if (list == null) return list;

		return list.map((item) => (item === '' || item == null ? null : +item));
	}
};

/** use-query-params' `withDefault`: `undefined` (and `null` unless `includeNull` is false) reads as `defaultValue`. */
function withDefault<D, DefaultType extends D2, D2 = D>(
	param: QueryParamConfig<D, D2>,
	defaultValue: DefaultType,
	includeNull?: false | undefined
): QueryParamConfig<D, Exclude<D2, undefined> | DefaultType>;
function withDefault<D, DefaultType extends D2, D2 = D>(
	param: QueryParamConfig<D, D2>,
	defaultValue: DefaultType,
	includeNull?: true
): QueryParamConfig<D, Exclude<D2, null | undefined> | DefaultType>;
function withDefault<D, DefaultType extends D2, D2 = D>(
	param: QueryParamConfig<D, D2>,
	defaultValue: DefaultType,
	includeNull = true
): QueryParamConfig<D, D2 | DefaultType> {
	return {
		...param,
		default: defaultValue,
		decode: (input) => {
			const decoded = param.decode(input);

			if (decoded === undefined) return defaultValue;
			if (includeNull && decoded === null) return defaultValue;

			return decoded;
		}
	};
}

/** A memo key that changes exactly when the wire value does. */
function wireKeyOf(value: EncodedValue): string {
	return value === undefined ? '\u0000' : JSON.stringify(value);
}

/**
 * Writes encoded changes the way use-query-params' `updateType`s do:
 * `*In` merges into the current query string (an `undefined` or `null`
 * removes the key), the others replace it; `replace*` replaces the history
 * entry. Nothing is written when the query string would not change.
 */
function commitChanges(
	router: AnyRouter,
	changes: Record<string, EncodedValue>,
	updateType: UrlUpdateType
): void {
	writeSearch(router, changes, {
		replace: updateType.startsWith('replace'),
		merge: updateType.endsWith('In')
	});
}

/** The decoded value of `name` on the location the router is at right now. */
function latestDecoded<D, D2>(
	router: AnyRouter,
	name: string,
	config: QueryParamConfig<D, D2>
): D2 {
	const search = currentLocation(router).search as Record<string, unknown>;

	return config.decode(search[name] as EncodedValue);
}

function useQueryParam<TypeToEncode, TypeFromDecode = TypeToEncode>(
	name: string,
	paramConfig: QueryParamConfig<
		TypeToEncode,
		TypeFromDecode
	> = StringParam as unknown as QueryParamConfig<TypeToEncode, TypeFromDecode>,
	options?: QueryParamOptions
): [
	TypeFromDecode,
	(newValue: NewValueType<TypeToEncode>, updateType?: UrlUpdateType) => void
] {
	const router = useRouter<AnyRouter>();
	const { searchStr } = useRenderedLocation();
	const encoded = useMemo(
		() => parseSearch(searchStr)[name] as EncodedValue,
		[searchStr, name]
	);
	const wireKey = wireKeyOf(encoded);
	const { decode } = paramConfig;
	const decoded = useMemo(
		() => decode(encoded),
		// `wireKey` stands for `encoded`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[wireKey, decode]
	);

	// The setter stays stable while an inline `withDefault(...)` config is
	// rebuilt every render, as use-query-params' did.
	const configRef = useRef(paramConfig);
	configRef.current = paramConfig;
	const defaultUpdateType = options?.updateType ?? 'replaceIn';

	const setValue = useCallback(
		(
			newValue: NewValueType<TypeToEncode>,
			updateType: UrlUpdateType = defaultUpdateType
		) => {
			const config = configRef.current;
			const value =
				typeof newValue === 'function'
					? (newValue as (latest: TypeToEncode) => TypeToEncode)(
							latestDecoded(router, name, config) as unknown as TypeToEncode
					  )
					: newValue;

			commitChanges(router, { [name]: config.encode(value) }, updateType);
		},
		[router, name, defaultUpdateType]
	);

	return [decoded, setValue];
}

function useQueryParams<M extends QueryParamConfigMap>(
	paramConfigMap: M,
	options?: QueryParamOptions
): [DecodedValueMap<M>, SetQuery<M>] {
	const router = useRouter<AnyRouter>();
	const { searchStr } = useRenderedLocation();
	const raw = useMemo(() => parseSearch(searchStr), [searchStr]);
	const keys = Object.keys(paramConfigMap);
	const wireKey = keys.map((key) => wireKeyOf(raw[key])).join('\u0000');
	const decoded = useMemo(
		() => {
			const values: Record<string, unknown> = {};
			for (const key of keys) {
				values[key] = paramConfigMap[key].decode(raw[key]);
			}

			return values as DecodedValueMap<M>;
		},
		// `wireKey` stands for the wire values of `keys`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[wireKey, paramConfigMap]
	);

	const configRef = useRef(paramConfigMap);
	configRef.current = paramConfigMap;
	const defaultUpdateType = options?.updateType ?? 'replaceIn';

	const setValues = useCallback<SetQuery<M>>(
		(changes, updateType = defaultUpdateType) => {
			const configMap = configRef.current;
			const resolved: Partial<Record<string, unknown>> =
				typeof changes === 'function'
					? changes(
							Object.fromEntries(
								Object.keys(configMap).map((key) => [
									key,
									latestDecoded(router, key, configMap[key])
								])
							) as DecodedValueMap<M>
					  )
					: changes;
			const encoded: Record<string, EncodedValue> = {};

			for (const [key, value] of Object.entries(resolved)) {
				// A key the map does not declare is written as a string, as
				// use-query-params' `extendParamConfigForKeys` did.
				encoded[key] = (configMap[key] ?? StringParam).encode(value);
			}

			commitChanges(router, encoded, updateType);
		},
		[router, defaultUpdateType]
	);

	return [decoded, setValues];
}

export {
	ArrayParam,
	BooleanParam,
	DateParam,
	JsonParam,
	NumberParam,
	NumericArrayParam,
	StringParam,
	useQueryParam,
	useQueryParams,
	withDefault
};
export type {
	DecodedValueMap,
	EncodedValue,
	NewValueType,
	QueryParamConfig,
	QueryParamConfigMap,
	QueryParamOptions,
	SetQuery,
	UrlUpdateType
};
