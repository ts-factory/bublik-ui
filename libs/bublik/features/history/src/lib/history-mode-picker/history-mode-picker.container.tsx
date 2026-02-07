/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Spinner } from '@/shared/tailwind-ui';
import { useUnmount } from '@/shared/hooks';

import { useHistoryActions, useSyncHistoryQueryToState } from '../slice';
import { HistoryLinearContainer } from '../history-linear';
import { HistoryAggregationContainer } from '../history-aggregation';

const PlotListContainer = lazy(() =>
	import('../history-measurements').then((module) => ({
		default: module.PlotListContainer
	}))
);

const PlotListContainerByResult = lazy(() =>
	import('../history-measurements').then((module) => ({
		default: module.PlotListContainerByResult
	}))
);

const HistoryMeasurementsCombinedContainer = lazy(() =>
	import('../history-measurements-combined').then((module) => ({
		default: module.HistoryMeasurementsCombinedContainer
	}))
);

export const HistoryPageModePickerContainer = () => {
	const actions = useHistoryActions();
	const [searchParams] = useSearchParams();
	const mode = searchParams.get('mode');

	useUnmount(() => actions.resetGlobalFilter());
	useSyncHistoryQueryToState();

	if (mode === 'linear') return <HistoryLinearContainer />;

	if (mode === 'aggregation') return <HistoryAggregationContainer />;

	if (mode === 'measurements') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<PlotListContainer />
			</Suspense>
		);
	}

	if (mode === 'measurements-by-iteration') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<PlotListContainerByResult />
			</Suspense>
		);
	}

	if (mode === 'measurements-combined') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<HistoryMeasurementsCombinedContainer />
			</Suspense>
		);
	}

	return <HistoryLinearContainer />;
};
