/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect } from 'react';

import { useGetHistoryAggregationQuery } from '@/services/bublik-api';

import { useHistoryPagination, useHistoryQuery } from '../hooks';
import {
	HistoryAggregation,
	HistoryLoadingAggregation
} from './history-aggregation.component';
import { useAggregationGlobalFilter } from './history-aggregation.hooks';
import { HistoryEmpty } from '../history-empty';
import { useHistoryActions } from '../slice';
import { HistoryError } from '../history-error';
import { useLocation } from 'react-router-dom';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

export const HistoryAggregationContainer = () => {
	const actions = useHistoryActions();
	const { pagination, handlePaginationChange } = useHistoryPagination();
	const { globalFilter, handleGlobalFilterChange } =
		useAggregationGlobalFilter();
	const state = useLocation().state as { fromRun?: boolean };
	const { query } = useHistoryQuery();

	useTabTitleWithPrefix([query?.testName, 'Aggregation - History - Bublik']);

	const { data, isLoading, isFetching, error } = useGetHistoryAggregationQuery(
		query,
		{ skip: state?.fromRun || !query.testName }
	);

	const handleOpenFormClick = useCallback(
		() => actions.toggleIsGlobalSearchOpen(true),
		[actions]
	);

	if (!query.testName) {
		return (
			<HistoryEmpty type="no-test-name" onOpenFormClick={handleOpenFormClick} />
		);
	}

	if (isLoading) return <HistoryLoadingAggregation />;

	if (error) {
		return <HistoryError error={error} onButtonClick={handleOpenFormClick} />;
	}

	if (data && !data.results.length && isFetching) {
		return <HistoryLoadingAggregation />;
	}

	if (!data || !data?.results.length) {
		return (
			<HistoryEmpty type="no-results" onOpenFormClick={handleOpenFormClick} />
		);
	}

	return (
		<div className={isFetching ? 'pointer-events-none opacity-40' : ''}>
			<HistoryAggregation
				data={data.results}
				pageCount={data.pagination.count}
				pagination={pagination}
				onPaginationChange={handlePaginationChange}
				globalFilter={globalFilter}
				onGlobalFilterChange={handleGlobalFilterChange}
			/>
		</div>
	);
};
