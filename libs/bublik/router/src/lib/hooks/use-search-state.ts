/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { camelizeKeys } from 'humps';

import { useLocation, useNavigate } from '../compat/navigation';
import {
	handleOldUrlParsing,
	isOldUrl,
	parseSearch,
	stringifySearch
} from '../parsing';

type Updater<S> = S | ((prevState: S) => S);

export interface UseSearchStateConfig {
	/**
	 * `'window'` used to bypass the router with `history.replaceState`; the
	 * TanStack router keeps its own keys in `history.state`, so it is now a
	 * replace navigation like the default.
	 */
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

			navigate({ search: searchStr }, { replace: config.type !== 'push' });
		},
		[config.type, navigate, search]
	);

	return [search, setSearch] as const;
};
