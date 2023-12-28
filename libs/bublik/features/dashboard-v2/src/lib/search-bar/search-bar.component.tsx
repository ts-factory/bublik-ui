/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';

import { useDebounce } from '@/shared/hooks';
import { SearchBar as TwSearchBar } from '@/shared/tailwind-ui';

export interface SearchBarProps {
	searchTerm?: string;
	onSearchTermChange?: (searchTerm: string) => void;
}

export const SearchBar = ({
	searchTerm,
	onSearchTermChange
}: SearchBarProps) => {
	const [term, setTerm] = useState(searchTerm ?? '');

	const debouncedTerm = useDebounce(term, 400);

	useEffect(
		() => onSearchTermChange?.(debouncedTerm),
		[debouncedTerm, onSearchTermChange]
	);

	return (
		<TwSearchBar
			value={term}
			autoComplete="off"
			placeholder="Search..."
			onChange={(e) => setTerm(e.target.value)}
		/>
	);
};
