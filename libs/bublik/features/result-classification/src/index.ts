/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
export * from './lib/classification';
export * from './lib/sidebar';

export { buildFacetOptions } from './lib/classification-table/classification-table.utils';
export type { FacetOption } from './lib/classification-table/classification-table.utils';

// The tables' URL state, which their routes declare as their search.
export {
	columnOverrides,
	defineClassificationSearch,
	idList,
	openRows,
	sorting
} from './lib/classification-table/classification-table.search';
export type {
	ClassificationSearch,
	ClassificationTableOptions
} from './lib/classification-table/classification-table.search';
export { ISSUES_TABLE_SEARCH } from './lib/issues-table/issues-table.constants';
export {
	ISSUE_RULES_TABLE_SEARCH,
	ISSUE_TABLE_SEARCH
} from './lib/issue-rules-table/issue-rules-table.constants';
export { RUN_ISSUES_TABLE_SEARCH } from './lib/run-issues-table/run-issues-table.constants';

export { IssuesTable } from './lib/issues-table';
export type { IssuesTableProps } from './lib/issues-table';

export { IssueRulesTable } from './lib/issue-rules-table';
export type { IssueRulesTableProps } from './lib/issue-rules-table';

export { RunIssuesTable, RunIssuesTableLoading } from './lib/run-issues-table';

export { IssueResults, RunIssueResults } from './lib/issue-results-table';
export type { RenderResultPreview } from './lib/issue-results-table';

export { IssueDetailHeader, IssueHeaderBar } from './lib/issue-detail';
export type {
	IssueDetailHeaderProps,
	IssueHeaderBarProps
} from './lib/issue-detail';

export { ClassifyButton, ClassifyResultContainer } from './lib/classify';
export type {
	ClassifyButtonProps,
	ClassifyResultContainerProps
} from './lib/classify';

export { ApplyRulesButton } from './lib/apply-rules';
export type { ApplyRulesButtonProps } from './lib/apply-rules';

export { RunIssuesButton } from './lib/run-issues-button';
export type { RunIssuesButtonProps } from './lib/run-issues-button';

export {
	IssueDrawer,
	NewIssueButton,
	EditIssueButton,
	IssueDeleteButton
} from './lib/issue-form';
export type {
	IssueDrawerProps,
	NewIssueButtonProps,
	EditIssueButtonProps,
	IssueDeleteButtonProps
} from './lib/issue-form';

export {
	RuleDrawer,
	NewRuleButton,
	EditRuleButton,
	DuplicateRuleButton,
	RuleDeleteButton
} from './lib/rule-form';
export type {
	RuleDrawerProps,
	NewRuleButtonProps,
	EditRuleButtonProps,
	DuplicateRuleButtonProps,
	RuleDeleteButtonProps
} from './lib/rule-form';

export {
	IssuePicker,
	TestPathCombobox,
	TestPathComboboxField
} from './lib/pickers';
export type {
	IssuePickerProps,
	TestPathComboboxProps,
	TestPathComboboxFieldProps
} from './lib/pickers';
