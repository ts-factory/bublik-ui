/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, redirect } from '@tanstack/react-router';

import { DashboardPageV2 } from '../../pages/dashboard-page';
import { loadDashboard } from '../-loaders';
import {
	dashboardSearch,
	rewriteLegacyDates
} from '../-search/dashboard.search';

export const Route = createFileRoute('/_app/dashboard')({
	validateSearch: dashboardSearch.validateSearch,
	search: { middlewares: dashboardSearch.middlewares },
	// A legacy `?dates=` link is rewritten in place before the page loads,
	// as the page's `<Navigate replace>` did, keeping the selected projects
	// and the sidebar state.
	beforeLoad: ({ search }) => {
		const rewritten = rewriteLegacyDates(search);

		if (rewritten) {
			throw redirect({
				to: '/dashboard',
				search: rewritten,
				replace: true,
				resetScroll: false
			});
		}
	},
	loader: loadDashboard,
	component: DashboardPageV2
});
