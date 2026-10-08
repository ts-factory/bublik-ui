/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageV2 } from '../../pages/dashboard-page';

export const Route = createFileRoute('/_app/dashboard')({
	component: DashboardPageV2
});
