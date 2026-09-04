/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { IssueRule, IssueState } from '@/shared/types';

export interface IssueRuleRow extends IssueRule {
	issueTitle: string;
	issueState: IssueState | null;
	bugKey: string | null;
	bugUrl: string | null;
	projectName: string;
}

export interface GetColumnsArgs {
	showIssue: boolean;
}

export interface IssueRulesTableProps {
	issueId?: number;
	projectId?: number;
	toolbarActions?: ReactNode;
}
