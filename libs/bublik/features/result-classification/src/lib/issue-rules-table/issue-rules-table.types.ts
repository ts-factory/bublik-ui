/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { IssueRule, IssueState } from '@/shared/types';

/**
 * A rule plus the issue it belongs to.
 *
 * `IssueRule` carries only `issue: number`, so the cross-issue view has to join
 * against the issues list to say anything more than an id. The per-issue view
 * needs none of it — the issue is already the page — so the join is skipped
 * there and the fields fall back to the id.
 */
export interface IssueRuleRow extends IssueRule {
	issueTitle: string;
	issueState: IssueState | null;
	bugKey: string | null;
	/** Resolved tracker URL, when the project can resolve one. */
	bugUrl: string | null;
	/** Resolved from `project`. `Project #id` until the project list arrives. */
	projectName: string;
}

export interface GetColumnsArgs {
	/** Only the cross-issue view needs to say which issue a rule belongs to. */
	showIssue: boolean;
}

export interface IssueRulesTableProps {
	/** Omit for the cross-issue view: every rule the caller is scoped to. */
	issueId?: number;
	/**
	 * Narrows the list to one project. Optional on purpose — omitted, the
	 * server returns every project's rules and the Project column says which is
	 * which. A rule is per-project, so the cross-project view is the one that
	 * answers "what will the classifier do to the next import"; scoping it to
	 * whichever project happened to be selected hid the rest with no indication
	 * they existed.
	 */
	projectId?: number;
	/** Toolbar slot, as `RunIssuesTable` has. Carries the New rule button. */
	toolbarActions?: ReactNode;
}
