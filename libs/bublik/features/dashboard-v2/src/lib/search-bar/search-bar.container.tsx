/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDashboardSearchTerm } from '../hooks';

import { SearchBar } from './search-bar.component';

export const SearchBarContainer = () => {
	const { term, setTerm } = useDashboardSearchTerm();

	const handleSearchTermChange = (term: string) => {
		setTerm(term);
	};

	return (
		<SearchBar
			searchTerm={term ?? ''}
			onSearchTermChange={handleSearchTermChange}
		/>
	);
};
