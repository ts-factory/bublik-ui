/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { RunIssueResultRow } from '@/shared/types';

export type ResultRow = RunIssueResultRow & { run_id?: number };

export interface IssueResultsProps {
	issueId: number;
	projectId?: number;
	runId?: number | string;
}
