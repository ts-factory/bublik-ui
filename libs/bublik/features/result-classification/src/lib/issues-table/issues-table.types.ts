/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { Issue, IssueCategory } from '@/shared/types';

import type { IssueRulesState } from '../classification/classification.utils';

/**
 * An issue row plus everything derivable from its rules. `/issues/` returns no
 * category and no rule count, but `/issue_rules/` carries both, so one extra
 * request turns a two-column list into something you can actually triage from.
 */
export interface IssueTableRow extends Issue {
	categories: IssueCategory[];
	ruleCount: number;
	activeRuleCount: number;
	rulesState: IssueRulesState;
	bugKey: string | null;
	bugUrl: string | null;
	/**
	 * Which projects this issue reaches, by name.
	 *
	 * An issue is global — `/issues/` carries no project at all — but a *rule* is
	 * per-project, so where an issue applies is the set of projects its rules
	 * live in. Derived from the same client-side rules join that already supplies
	 * `categories` and the rule counts, and inheriting its limitation: the two
	 * lists paginate independently, so an issue whose rules did not land on the
	 * fetched page shows nothing here.
	 */
	projectNames: string[];
}

export interface IssuesTableProps {
	/** Toolbar slot, as `RunIssuesTable` has. Carries the New issue button. */
	toolbarActions?: ReactNode;
}
