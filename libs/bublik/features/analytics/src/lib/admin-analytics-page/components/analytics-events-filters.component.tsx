/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { AnalyticsFacets } from '@/shared/types';
import { DataTableFacetedFilter, Input } from '@/shared/tailwind-ui';

import {
	AnalyticsFilterKey,
	ParsedQueryState
} from '../admin-analytics-page.types';

interface AnalyticsEventsFiltersProps {
	facets?: AnalyticsFacets;
	queryState: ParsedQueryState;
	isFacetsLoading: boolean;
	onFilterValuesChange: (key: AnalyticsFilterKey, values: string[]) => void;
	onSearchChange: (value?: string) => void;
	onPayloadSearchChange: (value?: string) => void;
}

function AnalyticsEventsFilters(props: AnalyticsEventsFiltersProps) {
	const {
		facets,
		queryState,
		isFacetsLoading,
		onFilterValuesChange,
		onSearchChange,
		onPayloadSearchChange
	} = props;

	return (
		<div className="flex items-center gap-2 w-full flex-wrap">
			<DataTableFacetedFilter
				title="Type"
				size="xss"
				options={(facets?.event_types ?? []).map((item) => ({
					label: `${item.value} (${item.count})`,
					value: item.value
				}))}
				value={queryState.eventTypes}
				onChange={(values) => onFilterValuesChange('event_type', values ?? [])}
				disabled={isFacetsLoading}
			/>
			<DataTableFacetedFilter
				title="Event"
				size="xss"
				options={(facets?.event_names ?? []).map((item) => ({
					label: `${item.value} (${item.count})`,
					value: item.value
				}))}
				value={queryState.eventNames}
				onChange={(values) => onFilterValuesChange('event_name', values ?? [])}
				disabled={isFacetsLoading}
			/>
			<DataTableFacetedFilter
				title="Path"
				size="xss"
				options={(facets?.paths ?? []).map((item) => ({
					label: `${item.value} (${item.count})`,
					value: item.value
				}))}
				value={queryState.paths}
				onChange={(values) => onFilterValuesChange('path', values ?? [])}
				disabled={isFacetsLoading}
			/>
			<DataTableFacetedFilter
				title="Anon ID"
				size="xss"
				options={(facets?.anon_ids ?? []).map((item) => ({
					label: `${item.value} (${item.count})`,
					value: item.value
				}))}
				value={queryState.anonIds}
				onChange={(values) => onFilterValuesChange('anon_id', values ?? [])}
				disabled={isFacetsLoading}
			/>
			<DataTableFacetedFilter
				title="Version"
				size="xss"
				options={(facets?.app_versions ?? []).map((item) => ({
					label: `${item.value} (${item.count})`,
					value: item.value
				}))}
				value={queryState.appVersions}
				onChange={(values) => onFilterValuesChange('app_version', values ?? [])}
				disabled={isFacetsLoading}
			/>
			<Input
				type="text"
				className="border rounded px-2 py-1 text-sm flex-1 min-w-[220px]"
				placeholder="Search path / event / anon id"
				value={queryState.search || ''}
				onChange={(event) => onSearchChange(event.target.value || undefined)}
			/>
			<Input
				type="text"
				className="border rounded px-2 py-1 text-sm min-w-[180px]"
				placeholder="Payload contains"
				value={queryState.payloadSearch || ''}
				onChange={(event) =>
					onPayloadSearchChange(event.target.value || undefined)
				}
			/>
		</div>
	);
}

export { AnalyticsEventsFilters };
