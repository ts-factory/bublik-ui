import type { IssueCategory, IssueRule } from '@/shared/types';

import { applyServerErrors } from '../shared/server-errors.utils';
import { itemsToList, itemsToParameters } from './matcher-fields.utils';
import { keyToExpected } from './rule-form.utils';
import { type RuleForm, type RuleFormValues } from './rule-form.types';

export const FIELD_BY_PATH: Record<string, keyof RuleFormValues> = {
	project: 'project',
	issue: 'issue',
	test: 'test',
	category: 'category',
	expected: 'expected',
	parameters: 'parameters',
	verdicts: 'verdicts',
	tags: 'tags'
};

export const LABEL_BY_PATH: Record<string, string> = {
	project: 'Project',
	issue: 'Issue',
	test: 'Test',
	category: 'Category',
	expected: 'Expected',
	parameters: 'Parameters',
	verdicts: 'Verdicts',
	tags: 'Tags',
	active: 'Rule'
};

export function applyRuleErrors(error: unknown, form: RuleForm) {
	applyServerErrors(error, form, {
		fieldForPath: (path) => FIELD_BY_PATH[path] ?? null,
		labelByPath: LABEL_BY_PATH
	});
}

export function buildRuleCreateBody(values: RuleFormValues) {
	return {
		project: values.project,
		issue: values.issue,
		test: values.test,
		category: values.category as IssueCategory,
		expected: keyToExpected(values.expected),
		parameters: itemsToParameters(values.parameters),
		verdicts: itemsToList(values.verdicts),
		tags: itemsToList(values.tags)
	};
}

export function buildRuleUpdateBody(values: RuleFormValues) {
	return {
		category: values.category as IssueCategory,
		expected: keyToExpected(values.expected)
	};
}

export function ruleActiveTransition(
	values: RuleFormValues,
	rule?: IssueRule | null
): 'activate' | 'deactivate' | null {
	const wantsActive = values.active === 'active';

	if (!rule) return wantsActive ? null : 'deactivate';
	if (wantsActive === rule.active) return null;

	return wantsActive ? 'activate' : 'deactivate';
}

export function buildRuleSubmitHandler(
	save: (values: RuleFormValues) => Promise<unknown>,
	form: RuleForm,
	onDone: () => void
) {
	return async (values: RuleFormValues) => {
		form.clearErrors('root');

		try {
			await save(values);
		} catch (error: unknown) {
			applyRuleErrors(error, form);
			return;
		}

		onDone();
	};
}
