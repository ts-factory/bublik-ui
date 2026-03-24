/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BublikErrorState } from '@/bublik/features/ui-state';
import {
	useGetAnalyticsEventsQuery,
	useGetAnalyticsFacetsQuery
} from '@/services/bublik-api';
import { analyticsEventNames } from '../../events';
import { trackEvent } from '../../tracker';

import { AnalyticsEventsSection } from '../components/analytics-events-section.component';
import { AnalyticsPagination } from '../components/analytics-pagination.component';
import {
	AnalyticsFilterKey,
	AnalyticsQueryArgs,
	ParsedQueryState
} from '../admin-analytics-page.types';
import {
	buildQueryArgs,
	clearFilterParams,
	hasActiveFilters,
	PAGE_SIZE_OPTIONS,
	parseSearchParams,
	updateQueryValue,
	updateQueryValues
} from '../admin-analytics-page.utils';

interface AnalyticsEventsSectionContainerProps {
	skip: boolean;
}

function AnalyticsEventsSectionContainer(
	props: AnalyticsEventsSectionContainerProps
) {
	const { skip } = props;
	const [searchParams, setSearchParams] = useSearchParams();

	const queryState = useMemo<ParsedQueryState>(
		() => parseSearchParams(searchParams),
		[searchParams]
	);

	const queryArgs = useMemo<AnalyticsQueryArgs>(
		() => buildQueryArgs(queryState),
		[queryState]
	);

	const {
		data: events,
		isLoading: isEventsLoading,
		error: eventsError,
		isFetching: isEventsFetching
	} = useGetAnalyticsEventsQuery(queryArgs, {
		skip,
		refetchOnMountOrArgChange: true
	});

	const {
		data: facets,
		isLoading: isFacetsLoading,
		error: facetsError
	} = useGetAnalyticsFacetsQuery(queryArgs, {
		skip,
		refetchOnMountOrArgChange: true
	});

	if (eventsError || facetsError) {
		return (
			<BublikErrorState
				error={eventsError ?? facetsError}
				className="h-[calc(100vh-256px)]"
			/>
		);
	}

	const totalCount = events?.pagination.count ?? 0;
	const currentPage = queryState.page;
	const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize));

	const handleFilterValuesChange = (
		key: AnalyticsFilterKey,
		values: string[]
	) => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: key,
			selectedCount: values.length
		});

		const params = new URLSearchParams(searchParams);
		updateQueryValues(params, key, values);
		setSearchParams(params);
	};

	const handleSearchChange = (value?: string) => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'search',
			hasValue: Boolean(value)
		});

		const params = new URLSearchParams(searchParams);
		updateQueryValue(params, 'search', value);
		setSearchParams(params);
	};

	const handlePayloadSearchChange = (value?: string) => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'payload_search',
			hasValue: Boolean(value)
		});

		const params = new URLSearchParams(searchParams);
		updateQueryValue(params, 'payload_search', value);
		setSearchParams(params);
	};

	const handleClearFilters = () => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'clear_all'
		});

		const params = new URLSearchParams(searchParams);
		clearFilterParams(params);
		setSearchParams(params);
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set('page', `${Math.max(1, Math.min(page, totalPages))}`);
		setSearchParams(params);
	};

	const handlePageSizeChange = (pageSize: number) => {
		const params = new URLSearchParams(searchParams);
		params.set(
			'page_size',
			`${
				PAGE_SIZE_OPTIONS.includes(
					pageSize as (typeof PAGE_SIZE_OPTIONS)[number]
				)
					? pageSize
					: queryState.pageSize
			}`
		);
		params.set('page', '1');
		setSearchParams(params);
	};

	return (
		<div className="bg-white rounded-md overflow-hidden flex flex-col flex-1 min-h-0 isolate">
			<AnalyticsEventsSection
				facets={facets}
				queryState={queryState}
				events={events?.results ?? []}
				totalCount={totalCount}
				isLoading={isEventsLoading}
				isFetching={isEventsFetching}
				isFacetsLoading={isFacetsLoading}
				hasFilters={hasActiveFilters(queryState)}
				onFilterValuesChange={handleFilterValuesChange}
				onSearchChange={handleSearchChange}
				onPayloadSearchChange={handlePayloadSearchChange}
				onClearFilters={handleClearFilters}
			/>
			<div className="border-t border-border-primary">
				<AnalyticsPagination
					currentPage={currentPage}
					totalPages={totalPages}
					pageSize={queryState.pageSize}
					pageSizeOptions={PAGE_SIZE_OPTIONS}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
				/>
			</div>
		</div>
	);
}

export { AnalyticsEventsSectionContainer };
