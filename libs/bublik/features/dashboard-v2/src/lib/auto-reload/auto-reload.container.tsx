/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';

import { useDashboardReload } from '../hooks';

import { AutoReloadToggle } from './auto-reload.component';

export const AutoReloadContainer = () => {
	const { isEnabled, setIsEnabled } = useDashboardReload();

	const handleCheckedChange = (enabled: boolean) => {
		trackEvent(analyticsEventNames.dashboardAutoReloadToggle, {
			enabled
		});

		setIsEnabled(enabled);
	};

	return (
		<AutoReloadToggle
			checked={isEnabled}
			onCheckedChange={handleCheckedChange}
		/>
	);
};
