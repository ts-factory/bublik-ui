/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { isFunction } from 'remeda';
import { defaultParser, defaultStringifier } from './lib/parsing';

export * from './lib/hooks';
// The legacy codec of the history link producers and the jsurl redirect.
// Its `parseSearch`/`stringifySearch` keep their legacy names so
// the router's raw codec in `./lib/search` owns the plain ones.
export {
	decode,
	decodeFromBinary,
	defaultParser,
	defaultStringifier,
	encode,
	encodeToBinary,
	handleOldUrlParsing,
	isOldUrl,
	parseSearch as legacyParseSearch,
	parseSearchWith,
	stringifySearch as legacyStringifySearch,
	stringifySearchWith
} from './lib/parsing';
export * from './lib/path';
export * from './lib/router';
export * from './lib/search';

export type Updater<T> = (valOrUpdater: ((currVal: T) => T) | T) => void;

export const useSearchParam = <T>(key: string, defaultValue: T) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

	const state = useMemo<T>(() => {
		const query = new URLSearchParams(location.search).get(key);

		if (key === 'expanded' && !query) {
			console.log('NO ITEM RETURN DEFATUL');
		}

		if (!query) {
			return defaultValue;
		}

		return defaultParser(query);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(defaultValue), key, location.search]);

	const setState: Updater<T> = useCallback(
		(valueOrUpdater) => {
			const params = new URLSearchParams(searchParams);
			if (isFunction(valueOrUpdater)) {
				const newValue = valueOrUpdater(state);
				console.log(newValue);
				params.set(key, defaultStringifier(newValue));

				setSearchParams(params);
			} else {
				params.set(key, defaultStringifier(valueOrUpdater));
				setSearchParams(params);
			}
		},
		[key, searchParams, setSearchParams, state]
	);

	if (key === 'expanded') {
		console.log(state);
	}

	return [state, setState] as const;
};
