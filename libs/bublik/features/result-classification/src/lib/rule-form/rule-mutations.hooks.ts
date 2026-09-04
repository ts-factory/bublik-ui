/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import {
	useActivateRuleMutation,
	useCreateRuleMutation,
	useDeactivateRuleMutation,
	useDeleteRuleMutation,
	useUpdateRuleMutation
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';
import type { IssueCategory, IssueRule } from '@/shared/types';

import {
	applyServerErrors,
	serverErrorText
} from '../shared/server-errors.utils';
import { itemsToList, itemsToParameters } from './matcher-fields.component';
import {
	keyToExpected,
	type RuleForm,
	type RuleFormValues
} from './rule-form.component';

const FIELD_BY_PATH: Record<string, keyof RuleFormValues> = {
	project: 'project',
	issue: 'issue',
	test: 'test',
	category: 'category',
	expected: 'expected',
	parameters: 'parameters',
	verdicts: 'verdicts',
	tags: 'tags'
};

const LABEL_BY_PATH: Record<string, string> = {
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

function applyRuleErrors(error: unknown, form: RuleForm) {
	applyServerErrors(error, form, {
		fieldForPath: (path) => FIELD_BY_PATH[path] ?? null,
		labelByPath: LABEL_BY_PATH
	});
}

export interface SaveRuleArgs {
	values: RuleFormValues;
	rule?: IssueRule | null;
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

export function useSaveRule() {
	const [createRule] = useCreateRuleMutation();
	const [updateRule] = useUpdateRuleMutation();
	const [activateRule] = useActivateRuleMutation();
	const [deactivateRule] = useDeactivateRuleMutation();

	return useCallback(
		async ({ values, rule }: SaveRuleArgs): Promise<IssueRule> => {
			const isEdit = Boolean(rule);
			const projectId = rule?.project ?? values.project;

			async function run(): Promise<IssueRule> {
				const transition = ruleActiveTransition(values, rule);

				if (!rule) {
					const created = await createRule({
						projectId,
						...buildRuleCreateBody(values)
					}).unwrap();

					if (transition !== 'deactivate') return created;

					return deactivateRule({ ruleId: created.id, projectId }).unwrap();
				}

				let saved = await updateRule({
					ruleId: rule.id,
					projectId,
					...buildRuleUpdateBody(values)
				}).unwrap();

				if (transition) {
					const move =
						transition === 'activate' ? activateRule : deactivateRule;

					saved = await move({ ruleId: rule.id, projectId }).unwrap();
				}

				return saved;
			}

			const promise = run();

			toast.promise(promise, {
				loading: isEdit ? 'Saving rule...' : 'Creating rule...',
				success: isEdit ? 'Rule saved' : 'Rule created',
				error: serverErrorText,
				position: 'top-center'
			});

			return promise;
		},
		[createRule, updateRule, activateRule, deactivateRule]
	);
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

export interface DeleteRuleArgs {
	ruleId: number;
	projectId?: number;
}

export function useDeleteRule() {
	const [deleteRule] = useDeleteRuleMutation();

	return useCallback(
		async ({ ruleId, projectId }: DeleteRuleArgs) => {
			const promise = deleteRule({ ruleId, projectId }).unwrap();

			toast.promise(promise, {
				loading: 'Deleting rule...',
				success: 'Rule deleted',
				error: serverErrorText,
				position: 'top-center'
			});

			return promise;
		},
		[deleteRule]
	);
}
