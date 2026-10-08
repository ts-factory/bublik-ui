/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { AdminAnalyticsPage } from '../../../../pages/admin-analytics';

export const Route = createFileRoute('/_app/admin/_admin/analytics')({
	component: AdminAnalyticsPage
});
