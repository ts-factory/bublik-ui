/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useHistoryQuery } from '../hooks';
import { useHistoryActions } from '../slice';
import { HistoryEmpty } from '../history-empty';
import { HistoryError } from '../history-error';
import {
	useGetHistoryMeasurements,
	useHistoryMeasurementsTitle
} from './plot-list.hooks';
import { PlotList, PlotListLoading } from './plot-list.component';

export const PlotListContainer = () => {
	const { query } = useHistoryQuery();
	const { data, isLoading, isFetching, error } = useGetHistoryMeasurements();
	const actions = useHistoryActions();

	useHistoryMeasurementsTitle(query?.testName);

	const handleOpenGlobalFormClick = () => {
		actions.toggleIsGlobalSearchOpen(true);
	};

	if (!query.testName) {
		return (
			<HistoryEmpty
				type="no-test-name"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	if (error) {
		return (
			<HistoryError error={error} onButtonClick={handleOpenGlobalFormClick} />
		);
	}

	if (isLoading) return <PlotListLoading />;

	if (!data?.length) {
		return (
			<HistoryEmpty
				type="no-results"
				onOpenFormClick={handleOpenGlobalFormClick}
			/>
		);
	}

	return <PlotList plots={data} isFetching={isFetching} />;
};
