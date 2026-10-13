/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { Issue } from '@/shared/types';

import type { IssueRulesState } from '../classification/classification.types';

export interface IssueTableRow extends Issue {
	ruleCount: number;
	activeRuleCount: number;
	rulesState: IssueRulesState;
	bugKey: string | null;
	bugUrl: string | null;
	projectName: string;
}

export interface IssuesTableProps {
	toolbarActions?: ReactNode;
}
