/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

export interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
	toolbarActions?: ReactNode;
}
