/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDispatch, useSelector } from 'react-redux';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { parseSearch } from '@/router';

import {
	DEFAULT_SEARCH_FORM_STATE,
	selectSearchState,
	useHistoryActions
} from '../slice';
import { historySearchStateToQuery } from '../slice/history-slice.utils';
import { useHistorySearch } from '../hooks';

export const HistoryResetGlobalFilterContainer = () => {
	const actions = useHistoryActions();
	const form = useSelector(selectSearchState);
	const mode = useHistorySearch((search) => search.mode ?? 'linear');
	const dispatch = useDispatch();
	const navigateWithProject = useNavigateWithProject();

	const handleResetClick = () => {
		trackEvent(analyticsEventNames.historyResetFiltersClick, {
			source: 'header'
		});

		actions.resetGlobalFilter();
		actions.resetSearchForm();

		const historyAPIQuery = historySearchStateToQuery({
			...DEFAULT_SEARCH_FORM_STATE,
			testName: form.testName,
			startDate: form.startDate,
			finishDate: form.finishDate
		});

		// Every key, the empty ones included; `navigateWithProject` adds `_s`,
		// `hide-sidebar` and the selected projects.
		const nextSearchParams = new URLSearchParams({ ...historyAPIQuery, mode });
		const searchString = nextSearchParams.toString();
		void navigateWithProject({
			to: '/history',
			search: parseSearch(searchString),
			replace: true
		});
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
