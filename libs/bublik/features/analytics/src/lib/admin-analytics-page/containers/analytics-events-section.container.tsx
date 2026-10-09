/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

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
	AnalyticsQueryArgs
} from '../admin-analytics-page.types';
import {
	buildQueryArgs,
	clearFilterChanges,
	filterValuesChanges,
	hasActiveFilters,
	PAGE_SIZE_OPTIONS,
	queryValueChanges
} from '../admin-analytics-page.utils';
import {
	useAnalyticsQueryState,
	useAnalyticsSearchWriter
} from '../admin-analytics-page.hooks';

interface AnalyticsEventsSectionContainerProps {
	skip: boolean;
}

function AnalyticsEventsSectionContainer(
	props: AnalyticsEventsSectionContainerProps
) {
	const { skip } = props;
	const queryState = useAnalyticsQueryState();
	const writeSearch = useAnalyticsSearchWriter();

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

		writeSearch(filterValuesChanges(key, values));
	};

	const handleSearchChange = (value?: string) => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'search',
			hasValue: Boolean(value)
		});

		writeSearch(queryValueChanges('search', value));
	};

	const handlePayloadSearchChange = (value?: string) => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'payload_search',
			hasValue: Boolean(value)
		});

		writeSearch(queryValueChanges('payload_search', value));
	};

	const handleClearFilters = () => {
		trackEvent(analyticsEventNames.adminAnalyticsFiltersApply, {
			filterKey: 'clear_all'
		});

		writeSearch(clearFilterChanges());
	};

	const handlePageChange = (page: number) => {
		writeSearch({ page: `${Math.max(1, Math.min(page, totalPages))}` });
	};

	const handlePageSizeChange = (pageSize: number) => {
		writeSearch({
			page_size: `${
				PAGE_SIZE_OPTIONS.includes(
					pageSize as (typeof PAGE_SIZE_OPTIONS)[number]
				)
					? pageSize
					: queryState.pageSize
			}`,
			page: '1'
		});
	};

	return (
		<div className="bg-bg-primary rounded-md overflow-hidden flex flex-col flex-1 min-h-0 isolate">
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
