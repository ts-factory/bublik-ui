/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { RunIssueResultRow } from '@/shared/types';

/**
 * A run-scoped row has no `run_id` — the run is the scope. An issue-scoped one
 * carries its own, because the same issue is stamped across many runs.
 */
export type ResultRow = RunIssueResultRow & { run_id?: number };

export interface IssueResultsProps {
	issueId: number;
	projectId?: number;
	/**
	 * The run to scope to. Omit for the issue-wide view, where results are
	 * gathered across every run the issue appears in.
	 */
	runId?: number | string;
}
