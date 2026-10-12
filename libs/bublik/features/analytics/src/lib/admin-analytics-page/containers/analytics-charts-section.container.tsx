/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useState } from 'react';

import { BublikErrorState } from '@/bublik/features/ui-state';
import { useGetAnalyticsChartsQuery } from '@/services/bublik-api';

import { AnalyticsChartsSection } from '../components/analytics-charts-section.component';
import { AnalyticsQueryArgs } from '../admin-analytics-page.types';
import {
	buildQueryArgs,
	filterValuesChanges
} from '../admin-analytics-page.utils';
import {
	useAnalyticsQueryState,
	useAnalyticsSearchWriter
} from '../admin-analytics-page.hooks';

interface AnalyticsChartsSectionContainerProps {
	skip: boolean;
}

function AnalyticsChartsSectionContainer(
	props: AnalyticsChartsSectionContainerProps
) {
	const { skip } = props;
	const queryState = useAnalyticsQueryState();
	const writeSearch = useAnalyticsSearchWriter();
	const [isChartsExposed, setIsChartsExposed] = useState(true);

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
		writeSearch({
			event_name: undefined,
			...filterValuesChanges('event_type', ['page_view']),
			...filterValuesChanges('path', [path])
		});
	};

	const handleEventNameClick = (eventName: string) => {
		writeSearch({
			...filterValuesChanges('event_type', ['event']),
			...filterValuesChanges('event_name', [eventName])
		});
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
