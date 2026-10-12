/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * `/runs/$runId/report`. A lib reads the schema, so it is defined in `@/shared/utils`
 * (`lib/run-report-search.ts`).
 */
export { isBlockOpen, runReportSearch } from '@/shared/utils';
export type { RunReportSearch } from '@/shared/utils';
