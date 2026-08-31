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

import { applyServerErrors, serverErrorText } from './server-errors';
import { itemsToList, itemsToParameters } from './matcher-fields';
import { keyToExpected, type RuleForm, type RuleFormValues } from './rule-form';

/** Wire paths the rule form has a control for. */
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
	/** Absent for a create. */
	rule?: IssueRule | null;
}

/** The POST body for a new rule. `active` is not on it — it is read-only. */
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

/**
 * The PATCH body for an edit: category and disposition, and nothing else.
 *
 * Every other writable field is in `_MATCHER_FIELDS`, which the serializer
 * rejects outright on a rule that has stamps — "Create a new rule instead".
 * Keeping them off the body is what makes that guard unreachable rather than a
 * 400 waiting to happen.
 */
export function buildRuleUpdateBody(values: RuleFormValues) {
	return {
		category: values.category as IssueCategory,
		expected: keyToExpected(values.expected)
	};
}

/**
 * Which lifecycle call the save needs, if any.
 *
 * On create there is no rule yet and the server has already made it active —
 * `active` is read-only, so only `deactivate` can undo that. On edit it is a
 * plain diff.
 */
export function ruleActiveTransition(
	values: RuleFormValues,
	rule?: IssueRule | null
): 'activate' | 'deactivate' | null {
	const wantsActive = values.active === 'active';

	if (!rule) return wantsActive ? null : 'deactivate';
	if (wantsActive === rule.active) return null;

	return wantsActive ? 'activate' : 'deactivate';
}

/**
 * Create or update a rule, and move its active flag to match the form.
 *
 * Like `useSaveIssue`, this is more than one request because the API splits
 * what the form joins:
 *
 * - `active` is read-only on `IssueRuleSerializer`, so a created rule is always
 *   active (the model default). "Create as inactive" is POST, then
 *   `POST /issue_rules/{id}/deactivate`.
 * - `_MATCHER_FIELDS` — project, issue, test, parameters, verdicts, tags — are
 *   rejected on a rule that has stamps. The update path therefore sends only
 *   `category` and `expected`, which is also what the form lets you edit, so
 *   the guard cannot fire.
 *
 * The project goes on the query string of every call: the permission decorator
 * reads `?project=`, and across a grouped table the row's own project is the
 * only correct value.
 */
export function useSaveRule() {
	const [createRule] = useCreateRuleMutation();
	const [updateRule] = useUpdateRuleMutation();
	const [activateRule] = useActivateRuleMutation();
	const [deactivateRule] = useDeactivateRuleMutation();

	return useCallback(
		async ({ values, rule }: SaveRuleArgs): Promise<IssueRule> => {
			const isEdit = Boolean(rule);
			// The rule's own project, not the table's: `?project=` is what the
			// write's permission check reads, and across a grouped list there is
			// no single table-level project to take it from.
			const projectId = rule?.project ?? values.project;

			async function run(): Promise<IssueRule> {
				const transition = ruleActiveTransition(values, rule);

				if (!rule) {
					const created = await createRule({
						projectId,
						...buildRuleCreateBody(values)
					}).unwrap();

					// The rule exists and is live for a moment before this lands. It
					// cannot be avoided from here — only `classify` can mint an
					// inactive rule in one call, because it bypasses the read-only
					// field server-side. Import is the only thing that reads `active`,
					// and it is not running in this window.
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

/**
 * On rejection the messages land on the fields that caused them and the drawer
 * stays open, so the request can be corrected rather than retyped.
 */
export function buildRuleSubmitHandler(
	save: (values: RuleFormValues) => Promise<unknown>,
	form: RuleForm,
	onDone: () => void
) {
	return async (values: RuleFormValues) => {
		// A stale root alert would otherwise survive a request that failed for an
		// entirely different reason.
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

/**
 * Deleting a rule takes its stamps with it (`RuleResult.issue_rule` is
 * `CASCADE`), so results it was explaining go back to counting as unexpected.
 * Disabling is the reversible alternative and sits in the same row.
 */
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
