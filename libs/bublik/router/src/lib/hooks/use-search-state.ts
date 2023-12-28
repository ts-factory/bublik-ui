/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { camelizeKeys } from 'humps';

import {
	handleOldUrlParsing,
	isOldUrl,
	parseSearch,
	stringifySearch
} from '../parsing';

type Updater<S> = S | ((prevState: S) => S);

export interface UseSearchStateConfig {
	type?: 'replace' | 'push' | 'window';
}

// eslint-disable-next-line @typescript-eslint/ban-types
const isFunction = (x: unknown): x is Function => typeof x === 'function';

export const useSearchState = <T extends Record<string, unknown>>(
	config: UseSearchStateConfig = {}
) => {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isOldUrl(location.search)) return;

		handleOldUrlParsing(location.search);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const search = useMemo<T>(
		() => camelizeKeys(parseSearch(location.search)) as T,
		[location.search]
	);

	const setSearch = useCallback(
		(updater: Updater<T>) => {
			const nextState = isFunction(updater) ? updater(search) : updater;
			const searchStr = stringifySearch(nextState);

			switch (config.type) {
				case 'push':
					navigate({ search: searchStr });
					break;
				case 'replace':
					navigate({ search: searchStr }, { replace: true });
					break;
				case 'window':
					window.history.replaceState(
						null,
						'',
						`${window.location.pathname}${searchStr}`
					);
					break;
				default:
					navigate({ search: searchStr }, { replace: true });
			}
		},
		[config.type, navigate, search]
	);

	return [search, setSearch] as const;
};
