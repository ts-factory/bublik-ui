/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useAuth } from '@/bublik/features/auth';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';
import { BublikEmptyState } from '@/bublik/features/ui-state';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';
import { Spinner } from '@/shared/tailwind-ui';

import { AdminAnalyticsPageComponent } from './admin-analytics-page.component';

function AdminAnalyticsPageContainer() {
	useTabTitleWithPrefix('Analytics - Bublik');

	const { isAdmin } = useAuth();
	const { data: features, isLoading: isFeatureLoading } =
		useGetServerFeaturesQuery();
	const isAnalyticsEnabled = Boolean(features?.analytics_enabled);

	if (isFeatureLoading) {
		return (
			<div className="h-full grid place-items-center">
				<Spinner className="h-16" />
			</div>
		);
	}

	if (!isAnalyticsEnabled) {
		return (
			<BublikEmptyState
				title="Analytics is disabled"
				description="Set ANALYTICS_ENABLED=True to enable anonymous analytics collection"
				className="h-full"
				iconName="LineChartOnline"
			/>
		);
	}

	if (!isAdmin) {
		return (
			<BublikEmptyState
				title="Admin access required"
				description="Only admin users can access analytics dashboard"
				className="h-full"
				iconName="Profile"
			/>
		);
	}

	return (
		<AdminAnalyticsPageComponent
			skipQueries={!isAnalyticsEnabled || !isAdmin}
		/>
	);
}

export { AdminAnalyticsPageContainer };
