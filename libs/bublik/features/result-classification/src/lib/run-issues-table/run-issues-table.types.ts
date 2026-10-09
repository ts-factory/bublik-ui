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
}
