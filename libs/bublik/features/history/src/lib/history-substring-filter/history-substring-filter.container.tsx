/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useState } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useDebounce } from '@/shared/hooks';

import { useHistoryActions } from '../slice';
import { HistorySubstringFilter } from './history-substring-filter.component';

export const HistorySubstringFilterContainer = () => {
	const actions = useHistoryActions();
	const [localGlobal, setLocalGlobal] = useState('');

	const handleSubstringFilterChange = useCallback((value: string) => {
		setLocalGlobal(value);
	}, []);

	const debounced = useDebounce(localGlobal, 1000);
	useEffect(() => {
		trackEvent(analyticsEventNames.historySubstringFilterApply, {
			hasValue: Boolean(debounced.trim()),
			valueLength: debounced.trim().length
		});

		actions.updateSubstringFilter(debounced);
	}, [actions, debounced]);

	return (
		<HistorySubstringFilter
			substringFilter={localGlobal}
			onSubstringChange={handleSubstringFilterChange}
		/>
	);
};
