/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResultRow } from './issue-results-table.types';

export function issueResultRunId(
	runId: number | string | undefined,
	row: ResultRow
): number | string | undefined {
	return runId ?? row.run_id;
}

export function issueResultTestPath(row: ResultRow): string {
	return [...row.path, row.name].filter(Boolean).join('/');
}
