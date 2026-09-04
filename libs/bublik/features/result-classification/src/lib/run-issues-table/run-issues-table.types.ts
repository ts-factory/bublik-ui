/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

export interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
	/** Rendered after the filters — e.g. the run-level Apply Rules action. */
	toolbarActions?: ReactNode;
}
