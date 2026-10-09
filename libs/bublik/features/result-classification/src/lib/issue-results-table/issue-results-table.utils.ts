/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResultRow } from './issue-results-table.types';

export function issueResultRunId(
	runId: number | string | undefined,
	row: ResultRow
): number | string | undefined {
	return runId ?? row.run_id;
}

/** The test's own name. */
export function issueResultTestName(row: ResultRow): string {
	return row.name ?? '';
}

/**
 * The package chain above the test, e.g. `pkg1/pkg2` for
 * `pkg1/pkg2/testpmd_txonly` — what tells apart two tests sharing a name.
 * Empty when the server could not resolve the path, or sent none.
 */
export function issueResultPackagePath(row: ResultRow): string {
	const path = row.path ?? '';
	const name = issueResultTestName(row);

	if (!path) return '';
	if (name && path.endsWith(`/${name}`)) return path.slice(0, -name.length - 1);

	return path === name ? '' : path;
}
