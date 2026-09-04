/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { Issue, IssueCategory } from '@/shared/types';

import type { IssueRulesState } from '../classification/classification.utils';

export interface IssueTableRow extends Issue {
	categories: IssueCategory[];
	ruleCount: number;
	activeRuleCount: number;
	rulesState: IssueRulesState;
	bugKey: string | null;
	bugUrl: string | null;
	projectNames: string[];
}

export interface IssuesTableProps {
	toolbarActions?: ReactNode;
}
