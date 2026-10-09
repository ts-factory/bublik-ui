/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * `/dashboard`. A lib reads the schema, so it is defined in
 * `@/shared/utils` (`lib/dashboard-search.ts`), with the legacy `?dates=` rewrite the route runs.
 */
export { dashboardSearch, rewriteLegacyDates } from '@/shared/utils';
export type { DashboardSearch } from '@/shared/utils';
