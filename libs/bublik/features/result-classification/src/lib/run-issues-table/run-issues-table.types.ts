/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { RenderResultPreview } from '../issue-results-table/issue-results-table.types';

export interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
	toolbarActions?: ReactNode;
	/** The preview trigger for each result under an expanded issue. */
	renderResultPreview?: RenderResultPreview;
	/**
	 * What an expanded issue's row unfolds into, in place of the built-in
	 * results list; for a host that can draw the run page's result table,
	 * which this library cannot depend on. What it renders can read the
	 * table's scroller, and where under the pinned row it is uncovered,
	 * from `useSubRowPin()`.
	 */
	renderIssueResults?: (issueId: number) => ReactNode;
}
