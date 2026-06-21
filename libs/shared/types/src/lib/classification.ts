/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */

export type IssueCategory =
	| 'product-defect'
	| 'test-bug'
	| 'env'
	| 'known-issue'
	| 'flaky'
	| 'to-investigate';

export type IssueState = 'open' | 'closed';

export type IssueExt = {
	id: number;
	key: string;
	status: string | null;
	title: string | null;
	synced_at: string | null;
};

export type Issue = {
	id: number;
	title: string;
	description: string | null;
	state: IssueState;
	issue_ext: IssueExt | null;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
};

export type IssueRule = {
	id: number;
	project: number;
	issue: number;
	category: IssueCategory;
	expected: boolean;
	active: boolean;
	test: number;
	match_parameters: boolean;
	match_verdicts: boolean;
	match_important_tags: boolean;
	match_all_tags: boolean;
	parameters: Record<string, string>;
	verdicts: string[];
	tags: string[];
};

/** Per-result classification badge data (embedded in run result rows). */
export type ResultIssueRef = {
	issue_id: number;
	issue_title: string;
	issue_state: IssueState;
	category: IssueCategory;
	expected: boolean;
	rule_id: number;
	origin: 'import' | 'manual_apply' | 'manual_oneoff';
};

export interface RunIssueRow {
	issue_id: number;
	title: string;
	state: IssueState;
	bug_key: string | null;
	result_count: number;
	categories: { category: IssueCategory; expected: boolean }[];
}

export interface RunIssueResultRow {
	result_id: number;
	name: string | null;
	path: string[];
	obtained_result: string | null;
	verdicts: string[];
}

export interface IssuePickerOption {
	id: number;
	title: string;
	key: string | null;
	category: IssueCategory | null;
}

export type ClassifyScope = 'future' | 'oneoff';

export interface ClassifyMatcher {
	matchParameters: boolean;
	matchVerdicts: boolean;
	matchImportantTags: boolean;
	matchAllTags: boolean;
}

export type ClassifyRequest = {
	resultId: number;
	projectId: number;
	issue: number | { title: string; description?: string; bug_key?: string };
	category: IssueCategory;
	expected?: boolean;
	scope: ClassifyScope;
	// Optional; keys are decamelized to match_* by prepareForSend. Omit to keep
	// the backend defaults (path + params + verdicts + important tags).
	matcher?: ClassifyMatcher;
};
