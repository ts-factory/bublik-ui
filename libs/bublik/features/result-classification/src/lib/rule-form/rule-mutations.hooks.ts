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
import type { IssueRule } from '@/shared/types';

import { serverErrorText } from '../shared/server-errors.utils';
import { type RuleFormValues } from './rule-form.types';
import {
	buildRuleCreateBody,
	buildRuleUpdateBody,
	ruleActiveTransition
} from './rule-mutations.utils';

export interface SaveRuleArgs {
	values: RuleFormValues;
	rule?: IssueRule | null;
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
