/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
export * from './lib/classification';
export * from './lib/sidebar';

export {
	ClassificationFooter,
	ClassificationRange,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	useSubRowPin
} from './lib/classification-table/classification-table.component';
export type { SubRowPin } from './lib/classification-table/classification-table.component';
export {
	PageParam,
	createPageSizeParam
} from './lib/classification-table/classification-table.params';
export { buildFacetOptions } from './lib/classification-table/classification-table.utils';
export { CategoryPresetButtons } from './lib/classification-table/category-preset-buttons.component';
export {
	CATEGORY_PRESETS,
	isPresetActive,
	isPresetAvailable
} from './lib/classification/category-presets';
export type {
	CategoryPreset,
	CategoryPresetId
} from './lib/classification/category-presets';
export type { FacetOption } from './lib/classification-table/classification-table.utils';

export { IssuesTable } from './lib/issues-table';
export type { IssuesTableProps } from './lib/issues-table';

export { IssueRulesTable } from './lib/issue-rules-table';
export type { IssueRulesTableProps } from './lib/issue-rules-table';

export { RunIssuesTable, RunIssuesTableLoading } from './lib/run-issues-table';

export { IssueResults, RunIssueResults } from './lib/issue-results-table';
export type { RenderResultPreview } from './lib/issue-results-table';

export {
	IssueDetailHeader,
	IssueHeaderBar,
	IssueResultsButton
} from './lib/issue-detail';
export type {
	IssueDetailHeaderProps,
	IssueHeaderBarProps,
	IssueResultsButtonProps
} from './lib/issue-detail';

export {
	BASELINE_TOGGLE,
	ClassifyButton,
	ClassifyResultContainer,
	ResultSelectionProvider,
	isClassifiable,
	useResultSelection
} from './lib/classify';
export type {
	ClassifyButtonProps,
	ClassifyResultContainerProps,
	ClassifyTargets,
	ResultSelection,
	ResultSelectionProviderProps,
	SelectableResult,
	SelectedResult
} from './lib/classify';

export { ApplyRulesButton } from './lib/apply-rules';
export type { ApplyRulesButtonProps } from './lib/apply-rules';

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
