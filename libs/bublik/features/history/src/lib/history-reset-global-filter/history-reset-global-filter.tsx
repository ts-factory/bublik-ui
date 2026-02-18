/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { PROJECT_KEY } from '@/bublik/features/projects';

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
	const dispatch = useDispatch();

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

		const nextSearchParams = new URLSearchParams({ ...historyAPIQuery, mode });
		nextSearchParams.delete(PROJECT_KEY);

		for (const [key, value] of searchParams) {
			if (key !== PROJECT_KEY) continue;
			nextSearchParams.append(PROJECT_KEY, value);
		}

		setSearchParams(nextSearchParams, { replace: true });
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
	};

	return (
		<ButtonTw
			variant="outline"
			size="md"
			rounded="lg"
			onClick={handleResetClick}
		>
			<Icon name="Refresh" className="size-6 -scale-x-90 mr-1.5" />
			<span>Reset Filter</span>
		</ButtonTw>
	);
};
