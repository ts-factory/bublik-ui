/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BublikErrorState } from '@/bublik/features/ui-state';
import { useGetAnalyticsChartsQuery } from '@/services/bublik-api';

import { AnalyticsChartsSection } from '../components/analytics-charts-section.component';
import {
	AnalyticsQueryArgs,
	ParsedQueryState
} from '../admin-analytics-page.types';
import {
	buildQueryArgs,
	parseSearchParams,
	updateQueryValues
} from '../admin-analytics-page.utils';

interface AnalyticsChartsSectionContainerProps {
	skip: boolean;
}

function AnalyticsChartsSectionContainer(
	props: AnalyticsChartsSectionContainerProps
) {
	const { skip } = props;
	const [searchParams, setSearchParams] = useSearchParams();
	const [isChartsExposed, setIsChartsExposed] = useState(true);

	const queryState = useMemo<ParsedQueryState>(
		() => parseSearchParams(searchParams),
		[searchParams]
	);

	const queryArgs = useMemo<AnalyticsQueryArgs>(
		() => buildQueryArgs(queryState),
		[queryState]
	);

	const {
		data: charts,
		isLoading: isChartsLoading,
		error
	} = useGetAnalyticsChartsQuery(queryArgs, {
		skip,
		refetchOnMountOrArgChange: true
	});

	if (error) {
		return <BublikErrorState error={error} className="h-[280px]" />;
	}

	const handlePagePathClick = (path: string) => {
		const params = new URLSearchParams(searchParams);
		params.delete('event_name');
		updateQueryValues(params, 'event_type', ['page_view']);
		updateQueryValues(params, 'path', [path]);
		setSearchParams(params);
	};

	const handleEventNameClick = (eventName: string) => {
		const params = new URLSearchParams(searchParams);
		updateQueryValues(params, 'event_type', ['event']);
		updateQueryValues(params, 'event_name', [eventName]);
		setSearchParams(params);
	};

	return (
		<AnalyticsChartsSection
			charts={charts}
			isChartsExposed={isChartsExposed}
			isChartsLoading={isChartsLoading}
			onToggleCharts={() => setIsChartsExposed((prev) => !prev)}
			onPagePathClick={handlePagePathClick}
			onEventNameClick={handleEventNameClick}
		/>
	);
}

export { AnalyticsChartsSectionContainer };
