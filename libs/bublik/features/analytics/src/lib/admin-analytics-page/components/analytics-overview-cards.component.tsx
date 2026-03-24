/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { AnalyticsOverview } from '@/shared/types';

interface AnalyticsOverviewCardsProps {
	overview?: AnalyticsOverview;
}

function AnalyticsOverviewCards(props: AnalyticsOverviewCardsProps) {
	const { overview } = props;

	return (
		<div className="grid grid-cols-1 bg-white rounded-md md:grid-cols-3 gap-1">
			<div className="p-4">
				<div className="text-xs text-text-secondary">Total Events</div>
				<div className="text-2xl font-semibold">
					{overview?.total_events ?? 0}
				</div>
			</div>
			<div className="p-4">
				<div className="text-xs text-text-secondary">Page Views</div>
				<div className="text-2xl font-semibold">
					{overview?.page_views ?? 0}
				</div>
			</div>
			<div className="p-4">
				<div className="text-xs text-text-secondary">Unique Anonymous IDs</div>
				<div className="text-2xl font-semibold">
					{overview?.unique_anonymous_users ?? 0}
				</div>
			</div>
		</div>
	);
}

export { AnalyticsOverviewCards };
