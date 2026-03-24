/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { CardHeader, ButtonTw } from '@/shared/tailwind-ui';
import { AnalyticsEvent, AnalyticsFacets } from '@/shared/types';

import {
	AnalyticsFilterKey,
	ParsedQueryState
} from '../admin-analytics-page.types';
import { AnalyticsEventsFilters } from './analytics-events-filters.component';
import { AnalyticsEventsTable } from './analytics-events-table.component';

interface AnalyticsEventsSectionProps {
	facets?: AnalyticsFacets;
	queryState: ParsedQueryState;
	events: AnalyticsEvent[];
	totalCount: number;
	isLoading: boolean;
	isFetching: boolean;
	isFacetsLoading: boolean;
	hasFilters: boolean;
	onFilterValuesChange: (key: AnalyticsFilterKey, values: string[]) => void;
	onSearchChange: (value?: string) => void;
	onPayloadSearchChange: (value?: string) => void;
	onClearFilters: () => void;
}

function AnalyticsEventsSection(props: AnalyticsEventsSectionProps) {
	const {
		facets,
		queryState,
		events,
		totalCount,
		isLoading,
		isFetching,
		isFacetsLoading,
		hasFilters,
		onFilterValuesChange,
		onSearchChange,
		onPayloadSearchChange,
		onClearFilters
	} = props;

	return (
		<div className="bg-white overflow-auto flex-1 min-h-0 isolate">
			<CardHeader
				label={
					<div className="flex items-center gap-2 w-full">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							Events
						</span>
						<AnalyticsEventsFilters
							facets={facets}
							queryState={queryState}
							isFacetsLoading={isFacetsLoading}
							onFilterValuesChange={onFilterValuesChange}
							onSearchChange={onSearchChange}
							onPayloadSearchChange={onPayloadSearchChange}
						/>
					</div>
				}
				className="sticky top-0 z-20 bg-white"
				enableStickyShadow
			>
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={onClearFilters}
					disabled={!hasFilters}
				>
					Clear
				</ButtonTw>
			</CardHeader>
			<AnalyticsEventsTable
				events={events}
				totalCount={totalCount}
				isLoading={isLoading}
				isFetching={isFetching}
			/>
		</div>
	);
}

export { AnalyticsEventsSection };
