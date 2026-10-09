/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * `/dashboard`. The schema lives in the dashboard lib, whose
 * hooks read and write its keys and whose specs mount it on the test
 * router; the route file and the schema specs take it from here.
 */
export { dashboardSearch } from '@/bublik/features/dashboard-v2';
export type { DashboardSearch } from '@/bublik/features/dashboard-v2';
