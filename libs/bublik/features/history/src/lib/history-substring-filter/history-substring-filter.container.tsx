/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';

import { useRenderedLocation, useSearchWriter } from '@/router';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { useHistorySearch } from '../hooks/use-history-search';
import { HISTORY_SEARCH_KEY } from '../slice/history-slice.utils';
import { HistorySubstringFilter } from './history-substring-filter.component';

const SEARCH_DEBOUNCE_MS = 1000;

export const HistorySubstringFilterContainer = () => {
	const { href } = useRenderedLocation();
	const search = useHistorySearch((search) => search.search ?? '');
	const writeSearch = useSearchWriter();
	const [value, setValue] = useState(search);
	const pendingWrite = useRef<ReturnType<typeof setTimeout>>();

	// Any navigation (Reset Filter, back/forward, this filter's own write)
	// settles the input on the URL and drops a write that has not fired yet
	useEffect(() => {
		clearTimeout(pendingWrite.current);
		setValue((current) => (current.trim() === search ? current : search));
	}, [href, search]);

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
			writeSearch(
				{ [HISTORY_SEARCH_KEY]: trimmed || undefined, page: '1' },
				{ replace: true }
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
