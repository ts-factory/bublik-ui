/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { useDashboardSearchTerm } from '../hooks';

import { SearchBar } from './search-bar.component';

export const SearchBarContainer = () => {
	const { term, setTerm } = useDashboardSearchTerm();

	const handleSearchTermChange = (nextTerm: string) => {
		const currentTerm = term ?? '';
		if (nextTerm === currentTerm) {
			return;
		}

		const trimmedTerm = nextTerm.trim();

		trackEvent(analyticsEventNames.dashboardSearchApply, {
			hasSearch: Boolean(trimmedTerm),
			searchLength: trimmedTerm.length
		});

		setTerm(nextTerm);
	};

	return (
		<SearchBar
			searchTerm={term ?? ''}
			onSearchTermChange={handleSearchTermChange}
		/>
	);
};
