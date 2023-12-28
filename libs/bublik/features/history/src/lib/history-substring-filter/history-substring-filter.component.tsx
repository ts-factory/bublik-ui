/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { SearchBar } from '@/shared/tailwind-ui';

interface HistorySubstringFilter {
	substringFilter?: string;
	onSubstringChange?: (value: string) => void;
}

export const HistorySubstringFilter: FC<HistorySubstringFilter> = (props) => {
	const { substringFilter, onSubstringChange } = props;

	return (
		<SearchBar
			name="substringFilter"
			value={substringFilter}
			onChange={(e) => onSubstringChange?.(e.target.value)}
			placeholder="Substring filter"
		/>
	);
};
