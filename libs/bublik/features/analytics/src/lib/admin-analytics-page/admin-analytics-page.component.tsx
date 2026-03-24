/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { AdminAnalyticsPageComponentProps } from './admin-analytics-page.types';
import {
	AnalyticsChartsSectionContainer,
	AnalyticsEventsSectionContainer,
	AnalyticsOverviewCardsContainer
} from './containers';

function AdminAnalyticsPageComponent(props: AdminAnalyticsPageComponentProps) {
	const { skipQueries } = props;

	return (
		<div className="p-2 h-full overflow-hidden flex flex-col gap-1">
			<AnalyticsOverviewCardsContainer skip={skipQueries} />
			<AnalyticsChartsSectionContainer skip={skipQueries} />
			<AnalyticsEventsSectionContainer skip={skipQueries} />
		</div>
	);
}

export { AdminAnalyticsPageComponent };
