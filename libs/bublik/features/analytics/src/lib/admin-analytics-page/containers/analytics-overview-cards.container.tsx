/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { BublikErrorState } from '@/bublik/features/ui-state';
import { useGetAnalyticsOverviewQuery } from '@/services/bublik-api';

import { AnalyticsOverviewCards } from '../components/analytics-overview-cards.component';

interface AnalyticsOverviewCardsContainerProps {
	skip: boolean;
}

function AnalyticsOverviewCardsContainer(
	props: AnalyticsOverviewCardsContainerProps
) {
	const { skip } = props;

	const { data: overview, error } = useGetAnalyticsOverviewQuery(undefined, {
		skip,
		refetchOnMountOrArgChange: true
	});

	if (error) {
		return <BublikErrorState error={error} className="h-[120px]" />;
	}

	return <AnalyticsOverviewCards overview={overview} />;
}

export { AnalyticsOverviewCardsContainer };
