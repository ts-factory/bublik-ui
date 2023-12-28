/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { ButtonTw } from '@/shared/tailwind-ui';

import {
	DEFAULT_SEARCH_FORM_STATE,
	selectSearchState,
	useHistoryActions
} from '../slice';
import { historySearchStateToQuery } from '../slice/history-slice.utils';

export const HistoryResetGlobalFilterContainer = () => {
	const actions = useHistoryActions();
	const form = useSelector(selectSearchState);
	const [searchParams, setSearchParams] = useSearchParams();

	const handleResetClick = () => {
		actions.resetGlobalFilter();
		actions.resetSearchForm();

		const historyAPIQuery = historySearchStateToQuery({
			...DEFAULT_SEARCH_FORM_STATE,
			testName: form.testName,
			startDate: form.startDate,
			finishDate: form.finishDate
		});

		const mode = searchParams.get('mode') ?? 'linear';
		setSearchParams({ ...historyAPIQuery, mode }, { replace: true });
	};

	return (
		<ButtonTw
			variant="outline"
			size="md"
			rounded="lg"
			onClick={handleResetClick}
		>
			Reset Filter
		</ButtonTw>
	);
};
