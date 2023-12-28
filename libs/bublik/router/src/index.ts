/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { isFunction } from 'remeda';
import { defaultParser, defaultStringifier } from './lib/parsing';

export * from './lib/hooks';
export * from './lib/parsing';
export * from './lib/router';

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
