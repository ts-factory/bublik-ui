/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSearchParams } from 'react-router-dom';

import { useUnmount } from '@/shared/hooks';

import { useHistoryActions, useSyncHistoryQueryToState } from '../slice';
import { HistoryLinearContainer } from '../history-linear';
import { HistoryAggregationContainer } from '../history-aggregation';
import {
	PlotListContainer,
	PlotListContainerByResult
} from '../history-measurements';
import { HistoryMeasurementsCombinedContainer } from '../history-measurements-combined';

export const HistoryPageModePickerContainer = () => {
	const actions = useHistoryActions();
	const [searchParams] = useSearchParams();
	const mode = searchParams.get('mode');

	useUnmount(() => actions.resetGlobalFilter());
	useSyncHistoryQueryToState();

	if (mode === 'linear') return <HistoryLinearContainer />;
	if (mode === 'aggregation') return <HistoryAggregationContainer />;
	if (mode === 'measurements') return <PlotListContainer />;
	if (mode === 'measurements-by-result') return <PlotListContainerByResult />;
	if (mode === 'measurements-combined') {
		return <HistoryMeasurementsCombinedContainer />;
	}

	return <HistoryLinearContainer />;
};
