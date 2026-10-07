/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StringParam, useQueryParams, withDefault } from 'use-query-params';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { HISTORY_SEARCH_KEY } from '../slice/history-slice.utils';
import { HistorySubstringFilter } from './history-substring-filter.component';

const SEARCH_DEBOUNCE_MS = 1000;

const SEARCH_PARAMS_CONFIG = {
	[HISTORY_SEARCH_KEY]: withDefault(StringParam, ''),
	page: StringParam
};

export const HistorySubstringFilterContainer = () => {
	const { key: locationKey } = useLocation();
	const [query, setQuery] = useQueryParams(SEARCH_PARAMS_CONFIG);
	const search = query[HISTORY_SEARCH_KEY];
	const [value, setValue] = useState(search);
	const pendingWrite = useRef<ReturnType<typeof setTimeout>>();

	// Any navigation (Reset Filter, back/forward, this filter's own write)
	// settles the input on the URL and drops a write that has not fired yet
	useEffect(() => {
		clearTimeout(pendingWrite.current);
		setValue((current) => (current.trim() === search ? current : search));
	}, [locationKey, search]);

	useEffect(() => () => clearTimeout(pendingWrite.current), []);

	const handleChange = (next: string) => {
		setValue(next);
		clearTimeout(pendingWrite.current);

		pendingWrite.current = setTimeout(() => {
			const trimmed = next.trim();
			if (trimmed === search) return;

			trackEvent(analyticsEventNames.historySubstringFilterApply, {
				hasValue: Boolean(trimmed),
				valueLength: trimmed.length
			});

			// The server filters before paginating, so the current page may be gone
			setQuery(
				{ [HISTORY_SEARCH_KEY]: trimmed || undefined, page: '1' },
				'replaceIn'
			);
		}, SEARCH_DEBOUNCE_MS);
	};

	return (
		<HistorySubstringFilter
			substringFilter={value}
			onSubstringChange={handleChange}
		/>
	);
};
