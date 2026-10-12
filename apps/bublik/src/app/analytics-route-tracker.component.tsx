/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useRenderedLocation } from '@/router';

import {
	setAnalyticsEnabled,
	trackPageView
} from '@/bublik/features/analytics';
import { bublikAPI } from '@/services/bublik-api';

function AnalyticsRouteTracker() {
	const { pathname } = useRenderedLocation();
	const { data: features } = bublikAPI.useGetServerFeaturesQuery();
	const isAnalyticsEnabled = Boolean(features?.analytics_enabled);

	useEffect(() => {
		setAnalyticsEnabled(isAnalyticsEnabled);
	}, [isAnalyticsEnabled]);

	useEffect(() => {
		if (!isAnalyticsEnabled) return;

		trackPageView({ path: pathname });
	}, [isAnalyticsEnabled, pathname]);

	return null;
}

export { AnalyticsRouteTracker };
